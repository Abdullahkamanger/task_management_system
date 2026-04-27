'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createTask } from '@/lib/actions';
import { toast } from 'sonner';

export default function AddTaskModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await createTask(formData);
      setIsOpen(false);
      toast.success('Task created successfully!');
      router.refresh();
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Failed to create task.');
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 bg-black text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="font-medium pr-1">New Task</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">Add New Task</h2>
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    name="title"
                    placeholder="Task title..."
                    required
                    className="w-full text-lg font-medium border-none text-gray-600 focus:ring-0 placeholder:text-gray-300"
                    autoFocus
                  />
                  
                  <textarea
                    name="description"
                    placeholder="Add a description (optional)"
                    className="w-full min-h-[100px] border-none focus:ring-0 text-gray-600 resize-none placeholder:text-gray-300"
                  />

                  <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                    <select name="priority" className="bg-gray-50 border-none rounded-lg text-sm text-gray-600 focus:ring-1 focus:ring-gray-200">
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>

                    <button
                      type="submit"
                      className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}