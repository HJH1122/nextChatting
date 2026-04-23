"use client";

import { Poll, PollOption } from "@/types/socket";
import { useSocket } from "@/components/providers/socket-provider";
import { Check } from "lucide-react";

interface PollDisplayProps {
  poll: Poll;
  currentUserId: string;
  isMyMessage: boolean;
}

export const PollDisplay = ({ poll, currentUserId, isMyMessage }: PollDisplayProps) => {
  const { socket } = useSocket();

  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);

  const handleVote = (optionId: string) => {
    if (!socket) return;
    socket.emit("vote", {
      pollId: poll.id,
      optionId,
      userId: currentUserId,
    });
  };

  return (
    <div className={`mt-3 p-3 rounded-xl border ${
      isMyMessage 
        ? "bg-white/10 border-white/20 text-white" 
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
    }`}>
      <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
        <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-black">Poll</span>
        {poll.question}
      </h4>
      
      <div className="space-y-2">
        {poll.options.map((option) => {
          const hasVoted = option.votes.some((v) => v.userId === currentUserId);
          const voteCount = option.votes.length;
          const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`w-full relative overflow-hidden rounded-lg border p-2.5 text-left transition-all group ${
                hasVoted
                  ? "border-blue-500 ring-1 ring-blue-500"
                  : isMyMessage 
                    ? "border-white/20 hover:bg-white/10" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              {/* Progress bar background */}
              <div 
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ease-out ${
                  hasVoted 
                    ? "bg-blue-500/20" 
                    : isMyMessage ? "bg-white/10" : "bg-zinc-100 dark:bg-zinc-800"
                }`}
                style={{ width: `${percentage}%` }}
              />
              
              <div className="relative flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    hasVoted 
                      ? "text-blue-600 dark:text-blue-400" 
                      : isMyMessage ? "text-white" : "text-zinc-700 dark:text-zinc-300"
                  }`}>
                    {option.text}
                  </span>
                  {hasVoted && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </div>
                <span className={`text-[10px] font-bold ${
                  isMyMessage ? "text-blue-100" : "text-zinc-500"
                }`}>
                  {voteCount > 0 && `${percentage}% (${voteCount})`}
                </span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <p className={`text-[10px] ${isMyMessage ? "text-blue-200" : "text-zinc-400"}`}>
          총 {totalVotes}명 투표함
        </p>
      </div>
    </div>
  );
};
