import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Server as ServerIO } from "socket.io";
import { Message, NextApiResponseServerIo } from "@/types/socket";
import { db } from "@/lib/db";
import { getLinkPreview } from "link-preview-js";

export const config = {
  api: {
    bodyParser: false,
  },
};

// URL 정규식 (http/https 또는 www. 로 시작하는 링크 감지)
const URL_REGEX = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g;

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log("[SOCKET_IO] Initializing new Socket.io server...");
    const path = "/api/socket/io";
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: path,
    });
    
    // 접속 중인 사용자 정보를 저장할 맵 (socket.id -> username)
    const onlineUsers = new Map<string, string>();

    io.on("connection", (socket) => {
      console.log(`[SOCKET_IO] New client connected: ${socket.id}`);

      // 사용자가 채팅방에 입장할 때 호출
      socket.on("join", (username: string) => {
        onlineUsers.set(socket.id, username);
        console.log(`[SOCKET_IO] User joined: ${username} (${socket.id})`);
        
        // 1. 전체 클라이언트에게 현재 접속자 목록 전송
        const userList = Array.from(new Set(onlineUsers.values()));
        io.emit("online-users", userList);

        // 2. 입장 알림 시스템 메시지 발송
        const joinMessage: Message = {
          id: `system-${Date.now()}-${socket.id}`,
          content: `${username}님이 입장하셨습니다.`,
          senderId: "system",
          roomId: "general", // 현재 고정된 방 ID 사용 중
          timestamp: new Date().toISOString(),
          type: "SYSTEM",
        };
        io.emit("receive-message", joinMessage);
      });

      socket.on("send-message", async (message: Message) => {
        console.log("[SOCKET_IO] Received message event:", message.content);
        try {
          // 데이터베이스 저장
          await db.user.upsert({
            where: { id: message.senderId },
            update: {},
            create: { 
              id: message.senderId, 
              name: message.senderId // ID(사용자가 입력한 닉네임)를 이름으로 사용
            },
          });

          await db.room.upsert({
            where: { id: message.roomId },
            update: {},
            create: { id: message.roomId, name: "자유 게시판" },
          });

          // 링크 프리뷰 추출 시도
          const urls = message.content.match(URL_REGEX);
          let previewData = null;

          if (urls && urls.length > 0) {
            let targetUrl = urls[0];
            
            // 프로토콜이 없는 경우 (예: www.google.com) http:// 를 붙여줌
            if (!targetUrl.startsWith("http")) {
              targetUrl = `http://${targetUrl}`;
            }

            try {
              const data: any = await getLinkPreview(targetUrl, {
                timeout: 3000,
                followRedirects: `follow`,
                headers: {
                  "user-agent": "googlebot", // 일부 사이트 차단 방지
                }
              });
              
              if (data && data.title) {
                previewData = {
                  title: data.title,
                  description: data.description || "",
                  image: data.images ? data.images[0] : (data.favicons ? data.favicons[0] : ""),
                  url: data.url
                };
              }
            } catch (err) {
              console.error("[LINK_PREVIEW_ERROR]", err);
            }
          }

          const savedMessage = await db.message.create({
            data: {
              content: message.content,
              userId: message.senderId,
              roomId: message.roomId,
              createdAt: new Date(message.timestamp),
              previewTitle: previewData?.title,
              previewDesc: previewData?.description,
              previewImage: previewData?.image,
              previewUrl: previewData?.url,
              attachments: message.attachments ? {
                create: message.attachments.map((attachment) => ({
                  fileUrl: attachment.fileUrl,
                  fileName: attachment.fileName,
                  fileType: attachment.fileType,
                  fileSize: attachment.fileSize,
                })),
              } : undefined,
              poll: message.poll ? {
                create: {
                  question: message.poll.question,
                  options: {
                    create: message.poll.options.map((opt) => ({
                      text: opt.text,
                    })),
                  },
                },
              } : undefined,
            },
            include: {
              user: { select: { name: true, imageUrl: true } },
              attachments: true,
              poll: {
                include: {
                  options: {
                    include: {
                      votes: { select: { userId: true } },
                    },
                  },
                },
              },
            }
          });

          const broadcastMessage: Message = {
            id: savedMessage.id,
            content: savedMessage.content,
            senderId: savedMessage.userId,
            roomId: savedMessage.roomId,
            timestamp: savedMessage.createdAt.toISOString(),
            type: "USER", // 일반 사용자 메시지 타입 지정
            user: savedMessage.user,
            attachments: savedMessage.attachments,
            poll: savedMessage.poll ? {
              id: savedMessage.poll.id,
              question: savedMessage.poll.question,
              closedAt: savedMessage.poll.closedAt?.toISOString() || null,
              options: savedMessage.poll.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes,
              })),
            } : undefined,
            // 클라이언트로 보낼 프리뷰 데이터 포함
            preview: previewData ? {
              title: savedMessage.previewTitle!,
              description: savedMessage.previewDesc!,
              image: savedMessage.previewImage!,
              url: savedMessage.previewUrl!
            } : undefined
          };

          console.log("[SOCKET_IO] Broadcasting to all clients...");
          io.emit("receive-message", broadcastMessage);

          // 챗봇 자동 응답 로직 ("/도움말" 명령어 처리)
          if (message.content.trim() === "/도움말") {
            setTimeout(async () => {
              try {
                const botId = "bot-helper";
                const botName = "도움말 봇";
                
                // 봇 사용자 생성/확인
                await db.user.upsert({
                  where: { id: botId },
                  update: { name: botName },
                  create: { id: botId, name: botName },
                });

                const botContent = "안녕하세요! 무엇을 도와드릴까요?\n현재 지원하는 명령어:\n/도움말 - 도움말 보기\n/투표 - 투표 관련 안내";

                const savedBotMessage = await db.message.create({
                  data: {
                    content: botContent,
                    userId: botId,
                    roomId: message.roomId,
                    createdAt: new Date(),
                  },
                  include: {
                    user: { select: { name: true, imageUrl: true } },
                  }
                });

                const botBroadcastMessage: Message = {
                  id: savedBotMessage.id,
                  content: savedBotMessage.content,
                  senderId: savedBotMessage.userId,
                  roomId: savedBotMessage.roomId,
                  timestamp: savedBotMessage.createdAt.toISOString(),
                  type: "BOT",
                  user: savedBotMessage.user,
                };

                io.emit("receive-message", botBroadcastMessage);
              } catch (botError) {
                console.error("[SOCKET_IO_BOT_ERROR]", botError);
              }
            }, 500); // 0.5초 지연 후 응답
          }
        } catch (error) {
          console.error("[SOCKET_IO_ERROR]", error);
        }
      });

      // 투표 이벤트 처리
      socket.on("vote", async ({ pollId, optionId, userId }) => {
        try {
          const existingVote = await db.vote.findUnique({
            where: {
              userId_pollId: {
                userId,
                pollId,
              },
            },
          });

          if (existingVote) {
            await db.vote.update({
              where: { id: existingVote.id },
              data: { optionId },
            });
          } else {
            await db.vote.create({
              data: {
                userId,
                pollId,
                optionId,
              },
            });
          }

          const updatedPoll = await db.poll.findUnique({
            where: { id: pollId },
            include: {
              options: {
                include: {
                  votes: { select: { userId: true } },
                },
              },
            },
          });

          if (updatedPoll) {
            io.emit("poll-update", {
              pollId: updatedPoll.id,
              options: updatedPoll.options.map((opt) => ({
                id: opt.id,
                text: opt.text,
                votes: opt.votes,
              })),
            });
          }
        } catch (error) {
          console.error("[SOCKET_IO_VOTE_ERROR]", error);
        }
      });

      // 타이핑 시작 이벤트 처리
      socket.on("typing", ({ roomId, username }) => {
        // 본인을 제외한 다른 클라이언트들에게 전송
        socket.broadcast.emit("user-typing", { roomId, username });
      });

      // 타이핑 중단 이벤트 처리
      socket.on("stop-typing", ({ roomId, username }) => {
        socket.broadcast.emit("user-stop-typing", { roomId, username });
      });

      socket.on("disconnect", () => {
        console.log(`[SOCKET_IO] Client disconnected: ${socket.id}`);
        const username = onlineUsers.get(socket.id);
        if (username) {
          onlineUsers.delete(socket.id);
          console.log(`[SOCKET_IO] User left: ${username}`);
          
          // 1. 업데이트된 접속자 목록 전송
          const userList = Array.from(new Set(onlineUsers.values()));
          io.emit("online-users", userList);

          // 2. 퇴장 알림 시스템 메시지 발송
          const leaveMessage: Message = {
            id: `system-leave-${Date.now()}-${socket.id}`,
            content: `${username}님이 퇴장하셨습니다.`,
            senderId: "system",
            roomId: "general",
            timestamp: new Date().toISOString(),
            type: "SYSTEM",
          };
          io.emit("receive-message", leaveMessage);
        }
      });
    });

    res.socket.server.io = io;
  } else {
    // 이미 서버가 존재하면 로그만 찍습니다.
    // console.log("[SOCKET_IO] Socket.io server already running");
  }

  res.end();
};

export default ioHandler;
