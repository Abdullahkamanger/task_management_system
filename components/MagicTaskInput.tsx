'use client';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { parseNaturalLanguageTask } from '@/lib/ai-actions';
import { createTask } from '@/lib/actions';
import { toast } from 'sonner';

export default function MagicTaskInput() {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleMagicAdd = async () => {
    if (!input.trim()) return;
    setIsParsing(true);
    const toastId = toast.loading("AI is parsing your request...");
    
    try {
      const details = await parseNaturalLanguageTask(input);
      await createTask({
        ...details,
        column: "To Do" // Default column
      });
      setInput('');
      toast.success(`Task added: ${details.title}`, { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("AI couldn't understand that one. Try being more specific.", { id: toastId });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl group mx-auto mb-8">
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-[#1d1d1d] rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="pl-4 text-purple-400">
          <Sparkles size={18} className={isParsing ? "animate-pulse" : ""} />
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try 'Fix the bug tomorrow at 3pm'..."
          className="w-full bg-transparent border-none px-4 py-4 text-sm text-white placeholder:text-gray-500 focus:ring-0 outline-none transition-all"
          onKeyDown={(e) => e.key === 'Enter' && handleMagicAdd()}
          disabled={isParsing}
        />
        <button 
          onClick={handleMagicAdd}
          className="mr-2 p-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          disabled={isParsing || !input.trim()}
        >
          {isParsing ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Magic Add</span>
              <Sparkles size={18} />
            </div>
          )}
        </button>
      </div>
      <p className="mt-2 text-[10px] text-gray-200 text-center uppercase tracking-[0.2em] font-medium opacity-90">
        Tasks will be Added in the "My Tasks" Section
      </p>
    </div>
  );
}
