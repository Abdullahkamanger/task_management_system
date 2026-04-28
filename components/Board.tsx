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

type Task = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  completed: boolean;
  column: string;
  order: number;
};

export default function Board({ initialColumns, initialTasks }: { initialColumns: string[], initialTasks: Task[] }) {
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
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
            column: newTasks[overIndex].column,
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
    const { over } = event;
    if (!over) return;

    // Use the latest tasks state from the ref to ensure we don't revert optimistic updates
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
    <div className="flex gap-6 h-full items-start pb-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {columns.map((colName) => (
          <TaskColumn
            key={colName}
            title={colName}
            tasks={tasks.filter(t => t.column === colName || (!t.column && colName === 'To Do'))}
          />
        ))}

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
      <AddColumn />
    </div>
  );
}
