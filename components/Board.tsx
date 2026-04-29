'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import TaskColumn from './TaskColumn';
import TaskCard from './TaskCard';
import AddColumn from './AddColumn';
import ConfirmationModal from './ConfirmationModal';
import { updateTaskOrders, updateTaskDate } from '@/lib/actions';
import { toast } from 'sonner';

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  completed: boolean;
  column: string;
  order: number;
  dueDate?: string;
};

type Column = {
  name: string;
  dueDate?: string;
};

export default function Board({ initialColumns, initialTasks }: { initialColumns: Column[], initialTasks: Task[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Constraint Modal State
  const [showModal, setShowModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ taskId: string, newDate: string } | null>(null);

  useEffect(() => {
    if (initialColumns.length > 0 && typeof initialColumns[0] === 'string') {
        setColumns((initialColumns as any).map((c: string) => ({ name: c })));
    } else {
        setColumns(initialColumns);
    }
  }, [initialColumns]);

  useEffect(() => {
    setTasks([...initialTasks].sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [initialTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t._id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t._id === activeId);
        const overIndex = prev.findIndex(t => t._id === overId);

        if (prev[activeIndex].column !== prev[overIndex].column) {
          const newTasks = [...prev];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            column: prev[overIndex].column,
          };
          return arrayMove(newTasks, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    if (isActiveTask && isOverColumn) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t._id === activeId);
        if (prev[activeIndex].column !== overId) {
          const newTasks = [...prev];
          newTasks[activeIndex] = {
            ...newTasks[activeIndex],
            column: overId as string,
          };
          const overTasks = prev.filter(t => t.column === overId);
          const newIndex = overTasks.length > 0 
            ? prev.findIndex(t => t._id === overTasks[overTasks.length - 1]._id) + 1 
            : prev.length;
          
          return arrayMove(newTasks, activeIndex, newIndex);
        }
        return prev;
      });
    }
  };

  const latestTasks = useRef(tasks);
  latestTasks.current = tasks;

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const task = tasks.find(t => t._id === active.id);
    const targetColumnName = over.data.current?.type === 'Column' ? over.id : over.data.current?.title;
    const targetColumn = columns.find(c => c.name === targetColumnName);

    // Check Constraints
    if (task && targetColumn?.dueDate && task.dueDate) {
      const taskDate = new Date(task.dueDate);
      const colDate = new Date(targetColumn.dueDate);
      
      if (taskDate < colDate) {
        setPendingUpdate({ taskId: task._id, newDate: targetColumn.dueDate });
        setShowModal(true);
      }
    }

    const updatedTasks = latestTasks.current.map((t, index) => ({
      ...t,
      order: index
    }));
    
    setTasks(updatedTasks);

    const updates = updatedTasks.map(t => ({ id: t._id, column: t.column, order: t.order }));
    updateTaskOrders(updates).catch(console.error);
  };

  async function confirmDateUpdate() {
    if (!pendingUpdate) return;
    try {
      await updateTaskDate(pendingUpdate.taskId, pendingUpdate.newDate);
      toast.success('Task date updated to match column deadline');
    } catch (e) {
      toast.error('Failed to update task date');
    }
    setPendingUpdate(null);
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  return (
    <div className="flex gap-6 h-full items-start pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((col) => (
          <TaskColumn
            key={col.name}
            column={col}
            tasks={tasks.filter(t => t.column === col.name || (!t.column && col.name === 'To Do'))}
          />
        ))}

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      <AddColumn />

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmDateUpdate}
        title="Schedule Conflict"
        message="You are moving a task that has a due date earlier than this column's deadline. Would you like to update the task's due date to match the column's?"
        confirmText="Update & Move"
        cancelText="Keep Original Date"
        type="warning"
      />
    </div>
  );
}
