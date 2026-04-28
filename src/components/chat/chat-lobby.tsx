"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, List, MessageCircle, Loader2 } from "lucide-react";

interface Room {
  id: string;
  name: string;
  createdAt: string;
}

interface ChatLobbyProps {
  onJoinRoom: (username: string, roomId: string, roomName: string) => void;
}

export const ChatLobby = ({ onJoinRoom }: ChatLobbyProps) => {
  const [username, setUsername] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [view, setView] = useState<"list" | "create">("list");

  // 방 목록 가져오기
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/rooms");
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isNameSet) {
      fetchRooms();
    }
  }, [isNameSet]);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setIsNameSet(true);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName }),
      });

      if (response.ok) {
        const newRoom = await response.json();
        onJoinRoom(username, newRoom.id, newRoom.name);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // 닉네임 입력 전 화면
  if (!isNameSet) {
    return (
      <div className="flex flex-col h-[500px] items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold">채팅 시작하기</h2>
          <p className="text-sm text-zinc-500">사용하실 닉네임을 입력해주세요.</p>
          <form onSubmit={handleSetName} className="space-y-3">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="닉네임 입력..."
              className="text-center"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={!username.trim()}>
              들어가기
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // 로비 화면
  return (
    <div className="flex flex-col h-[600px] border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">채팅 로비</h2>
          <p className="text-xs text-blue-600">반가워요, {username}님!</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={view === "list" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("list")}
            className="flex items-center gap-1"
          >
            <List className="w-4 h-4" /> 목록
          </Button>
          <Button 
            variant={view === "create" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setView("create")}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> 방 만들기
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {view === "list" ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-500 mb-2">참여 가능한 채팅방</h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-lg border-zinc-100 dark:border-zinc-800">
                <p className="text-sm text-zinc-500">생성된 방이 없습니다.</p>
                <Button variant="link" onClick={() => setView("create")}>첫 번째 방을 만들어보세요!</Button>
              </div>
            ) : (
              rooms.map((room) => (
                <div 
                  key={room.id}
                  onClick={() => onJoinRoom(username, room.id, room.name)}
                  className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30">
                      <MessageCircle className="w-5 h-5 text-zinc-500 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-xs text-zinc-500">{new Date(room.createdAt).toLocaleDateString()} 생성</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    입장하기
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="max-w-md mx-auto py-10 space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">새로운 채팅방 만들기</h3>
              <p className="text-sm text-zinc-500">방 이름을 정하고 대화를 시작해보세요.</p>
            </div>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">방 이름</label>
                <Input
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="예: 프로젝트 회의, 맛집 정보 공유..."
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={!newRoomName.trim() || isCreating}>
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                방 생성 및 입장
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setView("list")}>
                취소하고 목록으로 돌아가기
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
