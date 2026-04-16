"use client";

import { Message } from "@/types/socket";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  loadMore: () => void;
  shouldLoadMore: boolean;
}

export const MessageList = ({ 
  messages, 
  currentUserId, 
  loadMore, 
  shouldLoadMore 
}: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const hasInitialized = useRef(false);

  // 무한 스크롤 감지 (Intersection Observer)
  useEffect(() => {
    const topElement = topRef.current;
    if (!topElement || !shouldLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(topElement);
    return () => observer.disconnect();
  }, [loadMore, shouldLoadMore]);

  // 초기 로딩 및 메시지 추가 시 스크롤 제어
  useEffect(() => {
    if (messages.length === 0) return;

    // 1. 초기 렌더링 시 하단으로 이동
    if (!hasInitialized.current) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      hasInitialized.current = true;
      setPrevMessageCount(messages.length);
      return;
    }

    // 2. 새로운 메시지가 하단에 추가됨 (실시간 채팅)
    // 마지막 메시지가 내 메시지거나, 스크롤이 이미 하단 근처에 있다면 아래로 스크롤
    const isNewMessageAtBottom = messages.length > prevMessageCount;
    if (isNewMessageAtBottom) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId === currentUserId) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    setPrevMessageCount(messages.length);
  }, [messages, currentUserId, prevMessageCount]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      style={{ overflowAnchor: "none" }} // 수동 제어 모드
    >
      {/* 상단 감지 포인트 및 로딩 표시 */}
      <div ref={topRef} className="h-1" />
      {shouldLoadMore && (
        <div className="flex justify-center p-2">
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        </div>
      )}

      {messages.length === 0 && (
        <p className="text-center text-zinc-500 text-sm">대화를 시작해보세요!</p>
      )}

      {messages.map((message, index) => {
        const isMyMessage = message.senderId === currentUserId;
        const isSystemMessage = message.type === "SYSTEM";
        // 상단에 메시지가 추가될 때, 기존의 가장 첫 번째였던 메시지에 앵커를 걸어 스크롤 위치를 유지합니다.
        const isAnchor = index === messages.length - prevMessageCount;

        if (isSystemMessage) {
          return (
            <div 
              key={message.id} 
              className="flex justify-center my-2"
              style={isAnchor ? { overflowAnchor: "auto" } : { overflowAnchor: "none" }}
            >
              <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-full px-4 py-1">
                <p className="text-[11px] text-zinc-500 font-medium">
                  {message.content}
                </p>
              </div>
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
            style={isAnchor ? { overflowAnchor: "auto" } : { overflowAnchor: "none" }}
          >
            <span className="text-xs text-zinc-500 mb-1 px-1">
              {isMyMessage ? "나" : (message.user?.name || message.senderId)}
            </span>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                isMyMessage
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-tl-none"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-[10px] mt-1 text-right ${isMyMessage ? "text-blue-100" : "text-zinc-500"}`}>
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
