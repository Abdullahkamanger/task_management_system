'use client'; // This tells Next.js: "This is interactive!"

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask } from '@/lib/actions';
import { toast } from 'sonner'

type Task = {
  _id: string;
  title: string;
  completed: boolean;
};
// components/TaskCard.tsx
export default function TaskCard({ task }: { task: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  async function handleDelete() {
    try {
      await deleteTask(task._id);
      startTransition(() => {
        router.refresh();
        toast.success('Task deleted successfully');
      });
    } catch (err) {
      console.error('Failed to delete task', err);
      toast.error('Failed to delete task');
    }
  }

  const priorityColors = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={() => setIsEditing(true)}
      className="bg-[#22272b] p-4 rounded-lg shadow-md border border-white/5 cursor-pointer hover:border-white/20 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Priority Tag */}
          <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit mb-3 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
            {task.priority}
          </div>
          {/* title */}
          {isEditing ? (
            <input
              autoFocus
              className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm font-medium text-blue-400"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setIsEditing(false)} // Auto-saves when you click away
            />
          ) : (
            <h3
              onClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
              className="text-sm font-medium text-gray-100 cursor-text"
            >
              {title}
            </h3>
          )}

          {isEditing ? (
            <textarea
              autoFocus
              className="bg-transparent border-none focus:ring-0 p-0 w-full text-sm font-medium text-blue-400"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setIsEditing(false)} // Auto-saves when you click away
            />
          ) : (
            <p
              onClick={(event) => {
                event.stopPropagation();
                setIsEditing(true);
              }}
              className="text-xs text-gray-500 mt-2 line-clamp-2 cursor-text"
            >
              {description || 'Click to add a description...'}
            </p>
          )}
        </div>
        <div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>






  );
}