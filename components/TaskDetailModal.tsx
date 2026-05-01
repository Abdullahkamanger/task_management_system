'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlignLeft, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Trash2, 
  Plus, 
  Clock, 
  Layout,
  MessageSquare,
  Paperclip,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTask, toggleTaskComplete, updateTaskDescription } from '@/lib/actions';
import { toast } from 'sonner';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  completed: boolean;
  column: string;
  dueDate?: string;
  parentId?: string | null;
}

interface TaskDetailModalProps {
  task: Task;
  subtasks: Task[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskDetailModal({ task, subtasks, isOpen, onClose }: TaskDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(task.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const completedSubtasks = subtasks.filter(s => s.completed).length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const handleToggleSubtask = (subId: string, completed: boolean) => {
    startTransition(async () => {
      try {
        await toggleTaskComplete(subId, !completed);
        router.refresh();
        toast.success(completed ? "Subtask uncompleted" : "Subtask completed");
      } catch (e) {
        toast.error("Failed to update subtask");
      }
    });
  };

  const handleSaveDescription = () => {
    startTransition(async () => {
      try {
        await updateTaskDescription(task._id, description);
        setIsEditingDesc(false);
        toast.success("Description updated");
      } catch (e) {
        toast.error("Failed to update description");
      }
    });
  };

  const priorityColors = {
    high: "bg-red-500/20 text-red-400 border-red-500/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-[#22272b] rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-0">
            <div className="flex gap-4">
               <div className="mt-1 p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                 <Layout size={20} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-gray-100">{task.title}</h2>
                 <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    in list <span className="underline cursor-pointer hover:text-gray-300">{task.column}</span>
                 </p>
               </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Left Column: Description & Subtasks */}
              <div className="md:col-span-3 space-y-8">
                
                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-200">
                    <AlignLeft size={18} />
                    <h3 className="font-semibold">Description</h3>
                    {!isEditingDesc && description && (
                      <button 
                        onClick={() => setIsEditingDesc(true)}
                        className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  {isEditingDesc ? (
                    <div className="space-y-3">
                      <textarea
                        autoFocus
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add a more detailed description..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-300 focus:ring-1 focus:ring-blue-500 outline-none min-h-[120px] resize-none"
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSaveDescription}
                          disabled={isPending}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-1.5 rounded-md transition-all disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => {
                            setDescription(task.description || '');
                            setIsEditingDesc(false);
                          }}
                          className="text-gray-400 hover:text-white text-sm px-4 py-1.5 rounded-md transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => setIsEditingDesc(true)}
                      className={`text-sm text-gray-400 leading-relaxed cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-all ${!description && 'bg-white/5 h-12 flex items-center'}`}
                    >
                      {description || 'Add a more detailed description...'}
                    </div>
                  )}
                </div>

                {/* Subtasks (Checklist) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-200">
                      <CheckSquare size={18} />
                      <h3 className="font-semibold">Checklist</h3>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {subtasks.length > 0 ? `${Math.round(progress)}%` : '0%'}
                    </span>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    {subtasks.map((sub) => (
                      <div 
                        key={sub._id}
                        className="flex items-center gap-3 group px-2 py-2 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <button 
                          onClick={() => handleToggleSubtask(sub._id, sub.completed)}
                          className={`shrink-0 transition-colors ${sub.completed ? 'text-green-500' : 'text-gray-500 hover:text-blue-400'}`}
                        >
                          <CheckSquare size={18} fill={sub.completed ? 'currentColor' : 'none'} />
                        </button>
                        <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                          {sub.title}
                        </span>
                      </div>
                    ))}
                    
                    <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 px-2 py-2 w-full transition-colors">
                      <Plus size={16} />
                      Add an item
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Meta Info & Actions */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">Metadata</h4>
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-gray-600">Priority</span>
                      <div className={`text-[10px] uppercase font-bold px-2 py-1 rounded border w-fit ${priorityColors[task.priority as keyof typeof priorityColors] || priorityColors.low}`}>
                        {task.priority || 'medium'}
                      </div>
                    </div>
                    {task.dueDate && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-600">Due Date</span>
                        <div className="flex items-center gap-2 text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                          <Clock size={12} className="text-gray-500" />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2 tracking-widest">Actions</h4>
                  <div className="flex flex-col gap-2">
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-all group">
                      <UserIcon size={14} className="text-gray-500 group-hover:text-gray-300" />
                      Members
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-all group">
                      <Paperclip size={14} className="text-gray-500 group-hover:text-gray-300" />
                      Attachment
                    </button>
                    <button className="flex items-center gap-2 w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-all group">
                      <Sparkles size={14} className="text-purple-500 group-hover:text-purple-400" />
                      AI Optimization
                    </button>
                    <div className="pt-2 border-t border-white/5 mt-2">
                      <button 
                        onClick={async () => {
                          if (confirm('Delete this task?')) {
                            await deleteTask(task._id);
                            onClose();
                            toast.success("Task deleted");
                          }
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-all group"
                      >
                        <Trash2 size={14} />
                        Delete Task
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
