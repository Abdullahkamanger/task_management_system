import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import MagicTaskInput from '@/components/MagicTaskInput';
import Board from '@/components/Board';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/login");

  await connectDB();
  
  const user = await User.findById(session.user?.id).lean();
  const tasks = await Task.find({ userId: session.user?.id }).sort({ order: 1, createdAt: -1 }).lean();
  
  // Robust serialization for Tasks
  const serializedTasks = tasks.map((task: any) => ({
    ...JSON.parse(JSON.stringify(task)),
    _id: task._id.toString(),
    userId: task.userId.toString(),
    parentId: task.parentId ? task.parentId.toString() : null,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
    createdAt: task.createdAt?.toISOString?.(),
    updatedAt: task.updatedAt?.toISOString?.(),
  }));

  // Robust serialization for Columns
  const initialColumns = user?.columns?.map((col: any) => ({
    ...JSON.parse(JSON.stringify(col)),
    _id: col._id?.toString(),
    dueDate: col.dueDate ? col.dueDate.toISOString() : undefined,
  })) || [{ name: 'To Do' }, { name: 'In Progress' }, { name: 'Done' }];

  return (
    <>
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workspace</h1>
      </header>

      {/* AI Magic Input */}
      <MagicTaskInput />

      {/* Board Component - Scrolls horizontally */}
      <div className="flex-1 overflow-x-auto custom-scrollbar -mx-6 px-6">
        <Board initialColumns={initialColumns} initialTasks={serializedTasks} />
      </div>
    </>
  );
}