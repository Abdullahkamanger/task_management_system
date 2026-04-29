'use client'; // This tells Next.js: "This is interactive!"

import { motion } from 'framer-motion';
import { Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask, updateTaskTitle, updateTaskDescription, toggleTaskComplete, createTask } from '@/lib/actions';
import { generateSubtasks } from '@/lib/ai-actions';
import { toast } from 'sonner'

// components/TaskCard.tsx
export default function TaskCard({ task }: { task: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleAiBreakdown() {
    setIsGenerating(true);
    const toastId = toast.loading("AI is analyzing the task...");
    
    try {
      const subtasks = await generateSubtasks(task.title, task.description || '');
      
      if (!subtasks || subtasks.length === 0) {
        toast.error("AI couldn't generate sub-tasks", { id: toastId });
        return;
      }

      for (const sub of subtasks) {
        const formData = new FormData();
        formData.append('title', sub);
        formData.append('column', task.column);
        formData.append('description', `Sub-task for: ${task.title}`);
        await createTask(formData);
      }
      
      toast.success(`Generated ${subtasks.length} sub-tasks!`, { id: toastId });
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("AI integration failed", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  }

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

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleTaskComplete(task._id, !task.completed);
        toast.success(task.completed ? "Task uncompleted" : "Task marked as done");
      } catch (e) {
        toast.error("Failed to update task");
      }
    });
  };

  // Debounced Save for Title
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (title !== task.title && title.trim() !== '') {
        updateTaskTitle(task._id, title).catch(() => toast.error('Failed to save title'));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [title, task._id, task.title]);

  // Debounced Save for Description
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (description !== (task.description || '')) {
        updateTaskDescription(task._id, description).catch(() => toast.error('Failed to save description'));
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [description, task._id, task.description]);

  const priorityColors = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={`bg-[#22272b] p-4 rounded-lg shadow-md border ${task.completed ? 'border-green-500/30' : 'border-white/5 hover:border-white/20'} transition-all group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Priority Tag */}
          <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit mb-3 ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.low}`}>
            {task.priority}
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleToggle} disabled={isPending} className="mt-0.5 shrink-0">
              {task.completed ? 
                <CheckCircle2 size={18} className="text-green-500" /> : 
                <Circle size={18} className="text-gray-500 hover:text-blue-400" />
              }
            </button>
            <div className="flex-1 min-w-0">
              {/* Title */}
              {editingField === 'title' ? (
                <input
                  autoFocus
                  className="bg-black/20 border border-blue-500/50 rounded focus:ring-1 focus:ring-blue-500 p-1 w-full text-sm font-medium text-blue-400 outline-none"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setEditingField(null)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingField(null); }}
                />
              ) : (
                <h3
                  onClick={() => setEditingField('title')}
                  className={`text-sm font-medium cursor-text hover:bg-white/5 rounded p-1 -ml-1 transition-colors ${task.completed ? 'line-through text-gray-500' : 'text-gray-100'}`}
                >
                  {title}
                </h3>
              )}

              {/* Description */}
              {editingField === 'description' ? (
                <textarea
                  autoFocus
                  className="bg-black/20 border border-blue-500/50 rounded focus:ring-1 focus:ring-blue-500 p-1 mt-2 w-full text-xs font-medium text-blue-400 outline-none min-h-[60px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setEditingField(null)}
                />
              ) : (
                <p
                  onClick={() => setEditingField('description')}
                  className={`text-xs mt-2 line-clamp-2 cursor-text hover:bg-white/5 rounded p-1 -ml-1 transition-colors min-h-[24px] ${task.completed ? 'text-gray-600' : 'text-gray-500'}`}
                >
                  {description || 'Click to add a description...'}
                </p>
              )}

              {/* Due Date Badge */}
              {task.dueDate && (
                <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-medium w-fit px-2 py-0.5 rounded ${
                  new Date(task.dueDate) < new Date() && !task.completed
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-white/5 text-gray-400 border border-white/10'
                }`}>
                  <CalendarIcon size={10} />
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {new Date(task.dueDate) < new Date() && !task.completed && " • Overdue"}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
          
          <button 
            onClick={handleAiBreakdown}
            disabled={isGenerating || isPending}
            title="AI Breakdown"
            className={`mt-1 p-1.5 rounded-md flex items-center justify-center transition-all ${
              isGenerating 
              ? "bg-purple-600/20 text-purple-400" 
              : "bg-purple-600/10 text-purple-400 opacity-0 group-hover:opacity-100 hover:bg-purple-600 hover:text-white"
            }`}
          >
            <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}