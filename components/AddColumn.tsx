'use client';
import { useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { addColumn } from '@/lib/actions';

export default function AddColumn() {
  const [isAdding, setIsAdding] = useState(false);
  const [columnName, setColumnName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!columnName.trim()) return;

    startTransition(async () => {
      try {
        await addColumn(columnName.trim());
        toast.success(`List "${columnName.trim()}" added!`);
        setIsAdding(false);
        setColumnName('');
      } catch (err) {
        toast.error('Failed to add list');
      }
    });
  };

  if (isAdding) {
    return (
      <div className="w-80 shrink-0 bg-[#101204]/50 rounded-xl p-3 border border-white/5 h-fit">
        <form onSubmit={handleAddColumn} className="space-y-3">
          <input
            autoFocus
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            placeholder="Enter list title..."
            className="w-full rounded-lg border border-white/10 bg-[#15181d] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending || !columnName.trim()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add list
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              disabled={isPending}
              className="p-2 text-gray-400 hover:text-gray-200 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setIsAdding(true)}
      className="w-80 shrink-0 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center gap-2 transition-all group h-fit"
    >
      <Plus size={18} className="text-gray-400 group-hover:text-white" />
      <span className="text-gray-400 group-hover:text-white font-medium">Add another list</span>
    </button>
  );
}
