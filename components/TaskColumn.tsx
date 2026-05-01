'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus, MoreVertical, Trash2, Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { createTask, deleteColumn, updateColumnDate } from '@/lib/actions';
import SortableTaskCard from './SortableTaskCard';
import ConfirmationModal from './ConfirmationModal';

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  completed: boolean;
  column: string;
  order: number;
  dueDate?: string;
  parentId?: string | null;
};

type Column = {
  name: string;
  dueDate?: string;
};

export default function TaskColumn({ column, tasks, allTasks }: { column: Column, tasks: Task[], allTasks: Task[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // New Task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');

  const { setNodeRef } = useDroppable({
    id: column.name,
    data: {
      type: 'Column',
      title: column.name,
    },
  });

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    const formData = new FormData();
    formData.set('title', newTitle);
    formData.set('description', newDescription);
    formData.set('priority', newPriority);
    formData.set('column', column.name);
    if (newDueDate) formData.set('dueDate', newDueDate);

    startTransition(async () => {
      try {
        await createTask(formData);
        setIsAdding(false);
        setNewTitle('');
        setNewDescription('');
        setNewPriority('medium');
        setNewDueDate('');
        toast.success('Task added');
      } catch (error) {
        toast.error('Unable to add task');
      }
    });
  }

  function handleDeleteColumn() {
    startTransition(async () => {
      try {
        await deleteColumn(column.name);
        toast.success('Column deleted');
      } catch (e) {
        toast.error('Failed to delete column');
      }
    });
  }

  function handleUpdateDate(date: string) {
    startTransition(async () => {
      try {
        await updateColumnDate(column.name, date || null);
        toast.success('Column deadline updated');
      } catch (e) {
        toast.error('Failed to update deadline');
      }
    });
  }

  const taskIds = tasks.map(t => t._id);

  return (
    <div 
      ref={setNodeRef}
      className="w-80 shrink-0 bg-[#101204]/50 rounded-2xl p-4 flex flex-col max-h-full border border-white/5 shadow-xl relative group/column"
    >
      {/* Column Header */}
      <div className="flex items-start justify-between mb-4 px-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm uppercase tracking-wider text-gray-200 truncate">{column.name}</h2>
            <span className="text-[10px] bg-white/5 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
              {tasks.length}
            </span>
          </div>
          
          {/* Column Date Picker */}
          <div className="mt-2 flex items-center gap-2">
            <div className="relative group/date flex items-center gap-1.5 px-2 py-0.5 bg-black/20 rounded-md border border-white/5 hover:border-blue-500/30 transition-all">
                <CalendarIcon size={10} className="text-gray-500" />
                <input
                  type="date"
                  className="bg-transparent border-none p-0 text-[10px] text-gray-400 focus:outline-none focus:ring-0 cursor-pointer"
                  value={column.dueDate ? new Date(column.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateDate(e.target.value)}
                />
            </div>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-[#22272b] border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden py-1">
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete Column
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1 min-h-[100px] mb-4">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {(() => {
            const parents = tasks.filter(t => !t.parentId);
            return parents.map((task) => (
              <SortableTaskCard key={task._id} task={task} allTasks={allTasks} />
            ));
          })()}
        </SortableContext>
      </div>

      {/* Add Task Area */}
      <div className="mt-auto">
        {isAdding ? (
          <div className="bg-[#22272b] p-4 rounded-xl border border-blue-500/30 shadow-2xl">
            <form onSubmit={handleAddTask} className="space-y-4">
              <input
                autoFocus
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Task title"
                required
                className="w-full bg-black/20 border-none focus:ring-0 text-sm font-bold text-gray-100 placeholder:text-gray-600 rounded-lg p-2"
              />
              <textarea
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-black/10 border-none focus:ring-0 text-xs text-gray-400 placeholder:text-gray-600 rounded-lg p-2 min-h-[60px] resize-none"
              />
              
              <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-2 py-1 bg-black/20 rounded-lg border border-white/5">
                    <CalendarIcon size={12} className="text-gray-500" />
                    <input
                      type="date"
                      className="bg-transparent border-none p-0 text-[10px] text-gray-400 focus:outline-none focus:ring-0"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>
                  <select
                    value={newPriority}
                    onChange={(event) => setNewPriority(event.target.value as any)}
                    className="bg-black/20 border border-white/5 rounded-lg px-2 py-1 text-[10px] text-gray-400 focus:outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending || !newTitle.trim()}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg disabled:opacity-50"
                  >
                    {isPending ? 'Adding...' : 'Add Card'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 px-3 py-2.5 text-sm text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all"
          >
            <Plus size={16} />
            Add a card
          </button>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteColumn}
        title="Delete Column?"
        message={`This will permanently delete the "${column.name}" column and all ${tasks.length} tasks within it. This action cannot be undone.`}
        confirmText="Delete Column"
        type="danger"
      />
    </div>
  );
}