'use client';

import { useState, useTransition } from 'react';
import { Plus, X, Calendar as CalendarIcon } from 'lucide-react';
import { createTask } from '@/lib/actions';
import { toast } from 'sonner';

interface InlineTaskCreatorProps {
  defaultColumn?: string;
  defaultDueDate?: string;
  placeholder?: string;
  className?: string;
}

export default function InlineTaskCreator({ 
  defaultColumn = 'To Do', 
  defaultDueDate, 
  placeholder = "Add a task...",
  className = ""
}: InlineTaskCreatorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate || '');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('column', defaultColumn);
    if (dueDate) formData.append('dueDate', dueDate);

    startTransition(async () => {
      try {
        await createTask(formData);
        setTitle('');
        setDescription('');
        setDueDate(defaultDueDate || '');
        setIsAdding(false);
        toast.success('Task added');
      } catch (err) {
        toast.error('Failed to add task');
      }
    });
  }

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className={`flex items-center gap-2 w-full p-3 text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-all border border-dashed border-white/10 hover:border-white/20 ${className}`}
      >
        <Plus size={18} />
        <span className="text-sm font-medium">{placeholder}</span>
      </button>
    );
  }

  return (
    <div className={`bg-[#22272b] p-4 rounded-xl border border-blue-500/30 shadow-2xl ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Task title"
            className="w-full bg-black/20 border-none focus:ring-0 text-sm font-bold text-gray-100 placeholder:text-gray-600 rounded-lg p-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsAdding(false);
            }}
          />
          <textarea
            placeholder="Add a description..."
            className="w-full bg-black/10 border-none focus:ring-0 text-xs text-gray-400 placeholder:text-gray-600 rounded-lg p-2 min-h-[60px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3">
             <div className="relative group flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg border border-white/5 hover:border-white/20 transition-all">
                <CalendarIcon size={12} className="text-gray-500" />
                <input
                  type="date"
                  className="bg-transparent border-none p-0 text-[10px] text-gray-400 focus:outline-none focus:ring-0"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
             </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Adding...' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
