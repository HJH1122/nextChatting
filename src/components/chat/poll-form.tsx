"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, BarChart3 } from "lucide-react";

interface PollFormProps {
  onClose: () => void;
  onSubmit: (question: string, options: string[]) => void;
}

export const PollForm = ({ onClose, onSubmit }: PollFormProps) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = options.filter(opt => opt.trim() !== "");
    if (question.trim() && filteredOptions.length >= 2) {
      onSubmit(question, filteredOptions);
      onClose();
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-80 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-bold">새 설문조사</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-500 uppercase px-1">질문</label>
          <Input 
            value={question} 
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="궁금한 것이 무엇인가요?"
            className="text-sm h-9"
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-zinc-500 uppercase px-1">선택지 (최소 2개)</label>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input 
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`옵션 ${index + 1}`}
                  className="text-sm h-8"
                />
                {options.length > 2 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveOption(index)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {options.length < 10 && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddOption}
              className="w-full mt-2 text-xs h-8 border-dashed"
            >
              <Plus className="h-3 w-3 mr-1" /> 선택지 추가
            </Button>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full text-sm h-9 font-bold bg-blue-600 hover:bg-blue-700"
          disabled={!question.trim() || options.filter(o => o.trim() !== "").length < 2}
        >
          설문 게시
        </Button>
      </form>
    </div>
  );
};
