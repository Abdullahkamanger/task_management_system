import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Board from '@/components/Board';
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) redirect("/login");

  await connectDB();
  
  const user = await User.findById(session.user?.id).lean();
  const tasks = await Task.find({ userId: session.user?.id }).populate('userId').sort({ createdAt: -1 }).lean();
  const serializedTasks = tasks.map((task: any) => ({
    ...task,
    _id: task._id?.toString(),
    userId: task.userId?._id ? task.userId._id.toString() : task.userId?.toString?.(),
    createdAt: task.createdAt?.toISOString?.(),
    updatedAt: task.updatedAt?.toISOString?.(),
  }));

  return (
    // Change: Full height, flex-row to allow for a sidebar later
    <div className="flex h-screen bg-[#1d1d1d] overflow-hidden text-gray-200">
      
      {/* Workspace Content */}
      <main className="flex-1 flex flex-col p-6 overflow-x-auto custom-scrollbar">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Workspace</h1>
        </header>

        {/* Board Component */}
        <Board initialColumns={user?.columns || ['To Do']} initialTasks={serializedTasks} />
      </main>
    </div>
  );
}