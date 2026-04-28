'use client';
import { useState, type FormEvent } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createTask } from '@/lib/actions';
import SortableTaskCard from './SortableTaskCard';

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  completed: boolean;
  column: string;
  order: number;
};

export default function TaskColumn({ title, tasks }: { title: string, tasks: Task[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const { setNodeRef } = useDroppable({
    id: title,
    data: {
      type: 'Column',
      title,
    },
  });

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData();
    formData.set('title', newTitle);
    formData.set('description', newDescription);
    formData.set('priority', newPriority);
    formData.set('column', title);

    try {
      await createTask(formData);
      setIsAdding(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      toast.success('Task added');
    } catch (error) {
      console.error('Failed to add task', error);
      toast.error('Unable to add task');
    }
  }

  const taskIds = tasks.map(t => t._id);

  return (
    <div 
      ref={setNodeRef}
      className="w-80 shrink-0 bg-[#101204]/50 rounded-xl p-3 flex flex-col max-h-full border border-white/5"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-semibold text-xs uppercase tracking-wider text-gray-400">{title}</h2>
        <span className="text-xs text-gray-500">{tasks.length}</span>
      </div>

      <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-[100px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        {isAdding ? (
          <form onSubmit={handleAddTask} className="space-y-3">
            <input
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Card title"
              required
              className="w-full rounded-lg border border-white/10 bg-[#15181d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-white/10 bg-[#15181d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newPriority}
                onChange={(event) => setNewPriority(event.target.value as 'low' | 'medium' | 'high')}
                className="rounded-lg border border-white/10 bg-[#15181d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                Add card
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg border border-white/10 bg-[#15181d] px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:border-white/20 hover:bg-white/10"
          >
            <Plus size={14} />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}