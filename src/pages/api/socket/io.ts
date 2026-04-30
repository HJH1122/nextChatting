import { Server as NetServer } from "http";
import { NextApiRequest } from "next";
import { Message } from "@/types/socket";
import { db } from "@/lib/db";
import { getLinkPreview } from "link-preview-js";
import { getIo, NextApiResponseServerIo } from "@/lib/socket";

export const config = {
  api: {
    bodyParser: false,
  },
};

// URL 정규식 (http/https 또는 www. 로 시작하는 링크 감지)
const URL_REGEX = /((https?:\/\/[^\s]+)|(www\.[^\s]+))/g;

// 접속 중인 사용자 정보를 저장할 구조 (roomId -> Set of usernames)
// 전역적으로 관리하여 핸들러 재호출 시에도 유지되도록 함
const roomUsers = new Map<string, Set<string>>();
// 소켓별 닉네임과 방 정보를 저장 (socket.id -> { username, roomId })
const socketInfo = new Map<string, { username: string; roomId: string }>();

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = getIo(res.socket.server as NetServer, res);
    
  io.on("connection", (socket) => {
    console.log(`[SOCKET_IO] New client connected: ${socket.id}`);

    // 사용자가 채팅방에 입장할 때 호출
    socket.on("join-room", ({ username, roomId }: { username: string; roomId: string }) => {
      socket.join(roomId);
      socketInfo.set(socket.id, { username, roomId });

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId)!.add(username);

      console.log(`[SOCKET_IO] User ${username} joined room ${roomId}`);
      
      // 1. 해당 방의 클라이언트들에게 현재 방 접속자 목록 전송
      const userList = Array.from(roomUsers.get(roomId)!);
      io.to(roomId).emit("online-users", userList);

      // 2. 입장 알림 시스템 메시지 발송
      const joinMessage: Message = {
        id: `system-${Date.now()}-${socket.id}`,
        content: `${username}님이 입장하셨습니다.`,
        senderId: "system",
        roomId: roomId,
        timestamp: new Date().toISOString(),
        type: "SYSTEM",
      };
      io.to(roomId).emit("receive-message", joinMessage);
    });

    socket.on("send-message", async (message: Message) => {
      console.log(`[SOCKET_IO] Message to room ${message.roomId}:`, message.content);
      try {
        // 데이터베이스 저장
        await db.user.upsert({
          where: { id: message.senderId },
          update: {},
          create: { 
            id: message.senderId, 
            name: message.senderId 
          },
        });

        // 방 존재 확인 (없으면 생성 - 안전장치)
        await db.room.upsert({
          where: { id: message.roomId },
          update: {},
          create: { id: message.roomId, name: "채팅방" },
        });

        // 링크 프리뷰 추출 (기존 로직 유지)
        const urls = message.content.match(URL_REGEX);
        let previewData = null;

        if (urls && urls.length > 0) {
          let targetUrl = urls[0];
          if (!targetUrl.startsWith("http")) targetUrl = `http://${targetUrl}`;

          try {
            const data: any = await getLinkPreview(targetUrl, { timeout: 3000 });
            if (data && data.title) {
              previewData = {
                title: data.title,
                description: data.description || "",
                image: data.images ? data.images[0] : (data.favicons ? data.favicons[0] : ""),
                url: data.url
              };
            }
          } catch (err) {}
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
            }
          }
        });

        const broadcastMessage: Message = {
          id: savedMessage.id,
          content: savedMessage.content,
          senderId: savedMessage.userId,
          roomId: savedMessage.roomId,
          timestamp: savedMessage.createdAt.toISOString(),
          type: "USER",
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
          preview: previewData ? {
            title: savedMessage.previewTitle!,
            description: savedMessage.previewDesc!,
            image: savedMessage.previewImage!,
            url: savedMessage.previewUrl!
          } : undefined
        };

        // 특정 방에만 전송
        io.to(message.roomId).emit("receive-message", broadcastMessage);

        // 챗봇 응답 (특정 방에만)
        if (message.content.trim() === "/도움말") {
          setTimeout(async () => {
            const botContent = "무엇을 도와드릴까요? /도움말, /투표 명령어를 지원합니다.";
            io.to(message.roomId).emit("receive-message", {
              id: `bot-${Date.now()}`,
              content: botContent,
              senderId: "bot-helper",
              roomId: message.roomId,
              timestamp: new Date().toISOString(),
              type: "BOT",
              user: { name: "도움말 봇" }
            });
          }, 500);
        }
      } catch (error) {
        console.error("[SOCKET_IO_ERROR]", error);
      }
    });

    socket.on("vote", async ({ pollId, optionId, userId }) => {
      try {
        // 투표 로직 (기존 유지하되 브로드캐스트 대상 한정)
        await db.vote.upsert({
          where: { userId_pollId: { userId, pollId } },
          update: { optionId },
          create: { userId, pollId, optionId },
        });

        const updatedPoll = await db.poll.findUnique({
          where: { id: pollId },
          include: {
            message: { select: { roomId: true } },
            options: { include: { votes: { select: { userId: true } } } },
          },
        });

        if (updatedPoll) {
          io.to(updatedPoll.message.roomId).emit("poll-update", {
            pollId: updatedPoll.id,
            options: updatedPoll.options.map((opt) => ({
              id: opt.id,
              text: opt.text,
              votes: opt.votes,
            })),
          });
        }
      } catch (error) {}
    });

    socket.on("typing", ({ roomId, username }) => {
      socket.to(roomId).emit("user-typing", { roomId, username });
    });

    socket.on("stop-typing", ({ roomId, username }) => {
      socket.to(roomId).emit("user-stop-typing", { roomId, username });
    });

    socket.on("disconnect", () => {
      const info = socketInfo.get(socket.id);
      if (info) {
        const { username, roomId } = info;
        socketInfo.delete(socket.id);
        
        if (roomUsers.has(roomId)) {
          roomUsers.get(roomId)!.delete(username);
          const userList = Array.from(roomUsers.get(roomId)!);
          io.to(roomId).emit("online-users", userList);

          const leaveMessage: Message = {
            id: `system-leave-${Date.now()}`,
            content: `${username}님이 퇴장하셨습니다.`,
            senderId: "system",
            roomId: roomId,
            timestamp: new Date().toISOString(),
            type: "SYSTEM",
          };
          io.to(roomId).emit("receive-message", leaveMessage);
        }
      }
    });
  });

  res.end();
};

export default ioHandler;
