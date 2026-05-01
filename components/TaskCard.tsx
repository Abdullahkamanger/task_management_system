'use client'; // This tells Next.js: "This is interactive!"

import { motion } from 'framer-motion';
import { Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, Sparkles, CheckSquare } from 'lucide-react';
import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask, updateTaskTitle, updateTaskDescription, toggleTaskComplete, createTask } from '@/lib/actions';
import { generateSubtasks } from '@/lib/ai-actions';
import { toast } from 'sonner';
import TaskDetailModal from './TaskDetailModal';

// components/TaskCard.tsx
export default function TaskCard({ task, allTasks = [] }: { task: any, allTasks?: any[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingField, setEditingField] = useState<'title' | 'description' | null>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync state with props when they change externally
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    setDescription(task.description || '');
  }, [task.description]);

  const subtasks = allTasks.filter(t => {
    const pId = t.parentId?.toString();
    const currentId = task._id?.toString() || task.id?.toString();
    return pId && currentId && pId === currentId;
  });
  const completedSubtasks = subtasks.filter(t => t.completed).length;
  const isSubtask = !!task.parentId;

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
        formData.append('parentId', task._id);
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


  const priorityColors = {
    high: "bg-red-500/20 text-red-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    low: "bg-blue-500/20 text-blue-400",
  };

  return (
    <>
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onClick={(e) => {
        // Only open modal if not clicking an interactive element or editing
        if (!editingField) {
          setIsModalOpen(true);
        }
      }}
      className={`bg-[#22272b] p-4 rounded-lg shadow-md border ${task.completed ? 'border-green-500/30' : 'border-white/5 hover:border-white/20'} transition-all group cursor-pointer relative`}
    >
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Priority Tag */}
          <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-fit mb-3 ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.low}`}>
            {task.priority}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }} 
              disabled={isPending} 
              className="mt-0.5 shrink-0"
            >
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
                  onBlur={() => {
                    setEditingField(null);
                    if (title !== task.title && title.trim() !== '') {
                      updateTaskTitle(task._id, title).catch(() => toast.error('Failed to save title'));
                    }
                  }}
                  onKeyDown={(e) => { 
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      setEditingField(null);
                      if (title !== task.title && title.trim() !== '') {
                        updateTaskTitle(task._id, title).catch(() => toast.error('Failed to save title'));
                      }
                    }
                  }}
                />
              ) : (
                <h3 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingField('title');
                  }}
                  className={`text-sm font-semibold text-gray-100 mb-1 cursor-text hover:text-blue-400 transition-colors w-full ${task.completed ? 'line-through text-gray-500' : ''}`}
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
                  onKeyDown={(e) => e.stopPropagation()}
                  onBlur={() => {
                    setEditingField(null);
                    if (description !== (task.description || '')) {
                      updateTaskDescription(task._id, description).catch(() => toast.error('Failed to save description'));
                    }
                  }}
                />
              ) : (
                <p 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingField('description');
                  }}
                  className="text-xs text-gray-400 line-clamp-2 cursor-text hover:text-gray-300 transition-colors w-full"
                >
                  {description || 'Add a description...'}
                </p>
              )}

              {/* Due Date Badge */}
              {task.dueDate && (() => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                dueDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);
                const isOverdue = dueDate < today && !task.completed;

                return (
                  <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-medium w-fit px-2 py-0.5 rounded ${
                    isOverdue
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}>
                    <CalendarIcon size={10} />
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {isOverdue && " • Overdue"}
                  </div>
                );
              })()}

              {/* Subtasks Inline List */}
              {subtasks.length > 0 && (
                <div className="mt-3 space-y-1 bg-black/10 p-2 rounded-md border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Subtasks</span>
                    <span className="text-[10px] text-gray-500">{completedSubtasks}/{subtasks.length}</span>
                  </div>
                  {subtasks.slice(0, 3).map((sub: any) => (
                    <div key={sub._id} className="flex items-center gap-2 text-xs">
                      <CheckSquare size={12} className={sub.completed ? 'text-green-500' : 'text-gray-600'} />
                      <span className={`flex-1 text-xs leading-relaxed whitespace-normal break-words ${sub.completed ? 'line-through text-gray-600' : 'text-gray-400'}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))} 
                  {subtasks.length > 3 && (
                    <div className="text-[10px] text-gray-500 pl-5">+{subtasks.length - 3} more</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isPending}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-gray-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={14} />
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleAiBreakdown();
            }}
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

    <TaskDetailModal 
      task={task} 
      subtasks={subtasks} 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
    />
    </>
  );
}
