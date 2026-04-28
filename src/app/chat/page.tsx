"use client";

import { useState } from "react";
import { ChatRoom } from "@/components/chat/chat-room";
import { ChatLobby } from "@/components/chat/chat-lobby";

export default function ChatPage() {
  const [status, setStatus] = useState<"lobby" | "chat">("lobby");
  const [chatInfo, setChatInfo] = useState({
    username: "",
    roomId: "",
    roomName: "",
  });

  const handleJoinRoom = (username: string, roomId: string, roomName: string) => {
    setChatInfo({ username, roomId, roomName });
    setStatus("chat");
  };

  const handleLeaveRoom = () => {
    setStatus("lobby");
  };

  return (
    <main className="flex-1 p-4 md:p-8 h-[calc(100vh-64px)] max-w-4xl mx-auto">
      <div className="flex flex-col h-full space-y-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">실시간 채팅 서비스</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            {status === "lobby" 
              ? "닉네임을 입력하고 채팅방에 참여해보세요." 
              : `${chatInfo.roomName} 방에서 대화 중입니다.`}
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          {status === "lobby" ? (
            <ChatLobby onJoinRoom={handleJoinRoom} />
          ) : (
            <ChatRoom 
              username={chatInfo.username}
              roomId={chatInfo.roomId}
              roomName={chatInfo.roomName}
              onLeave={handleLeaveRoom}
            />
          )}
        </div>
      </div>
    </main>
  );
}
