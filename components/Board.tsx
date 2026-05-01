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
import { updateTaskOrders } from '@/lib/actions';
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
  parentId?: string | null;
};

type Column = {
  name: string;
  dueDate?: string;
};

export default function Board({ initialColumns, initialTasks }: { initialColumns: Column[], initialTasks: Task[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, args) => {
        const target = event.target as HTMLElement;
        const tag = target?.tagName?.toLowerCase();
        // Don't activate drag when user is typing in inputs
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
          return undefined;
        }
        return sortableKeyboardCoordinates(event, args);
      },
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

    // Helper: check if task date exceeds target column date
    const isDateBlocked = (taskDueDate: string | undefined, targetColName: string | number) => {
      const targetCol = columns.find(c => c.name === targetColName);
      if (!targetCol?.dueDate || !taskDueDate) return false;
      const tDate = new Date(taskDueDate);
      const cDate = new Date(targetCol.dueDate);
      tDate.setHours(0, 0, 0, 0);
      cDate.setHours(0, 0, 0, 0);
      return tDate > cDate;
    };

    if (isActiveTask && isOverTask) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t._id === activeId);
        const overIndex = prev.findIndex(t => t._id === overId);

        if (prev[activeIndex].column !== prev[overIndex].column) {
          // Block if date exceeds target column deadline
          if (isDateBlocked(prev[activeIndex].dueDate, prev[overIndex].column)) {
            dragBlocked.current = true;
            return prev;
          }
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
          // Block if date exceeds target column deadline
          if (isDateBlocked(prev[activeIndex].dueDate, overId)) {
            dragBlocked.current = true;
            return prev;
          }
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
  const dragBlocked = useRef(false);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    // If drag was blocked by date constraint, show toast and bail
    if (dragBlocked.current) {
      dragBlocked.current = false;
      const task = latestTasks.current.find(t => t._id === active.id);
      const targetColumnName = over.data.current?.type === 'Column' ? over.id : over.data.current?.title;
      const targetColumn = columns.find(c => c.name === targetColumnName);
      if (task && targetColumn?.dueDate) {
        const colDate = new Date(targetColumn.dueDate);
        colDate.setHours(0, 0, 0, 0);
        toast.error(`Cannot move task here. Its due date exceeds this column's deadline (${colDate.toLocaleDateString()}).`);
      }
      return;
    }

    const updatedTasks = latestTasks.current.map((t, index) => ({
      ...t,
      order: index
    }));
    
    setTasks(updatedTasks);

    const updates = updatedTasks.map(t => ({ id: t._id, column: t.column, order: t.order }));
    updateTaskOrders(updates).catch(console.error);
  };




  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full items-start pb-4">
        {columns.filter(col => col && col.name).map((col) => {
          const columnTasks = tasks.filter(t => t.column === col.name || (!t.column && col.name === 'To Do'));
          return (
            <TaskColumn
              key={col.name}
              column={col}
              tasks={columnTasks}
              allTasks={tasks}
            />
          );
        })}
        <AddColumn />
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeTask ? <TaskCard task={activeTask} /> : null}
      </DragOverlay>


    </DndContext>
  );
}
