import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import TaskCard from '@/components/TaskCard';
import TaskColumn from '@/components/TaskColumn';
// app/page.tsx
export default async function Home() {
  await connectDB();
  const tasks = await Task.find({}).sort({ createdAt: -1 }).lean();
  const serializedTasks = tasks.map((task: any) => ({
    ...task,
    _id: task._id?.toString(),
    userId: task.userId?.toString?.(),
    createdAt: task.createdAt?.toISOString?.(),
    updatedAt: task.updatedAt?.toISOString?.(),
  }));

  return (
    // Change: Full height, flex-row to allow for a sidebar later
    <div className="flex h-screen bg-[#1d1d1d] overflow-hidden text-gray-200">
      
      {/* Workspace Content */}
      <main className="flex-1 flex flex-col p-6 overflow-x-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">My Workspace</h1>
        </header>

        {/* Board Area: This is where Trello lives */}
        <div className="flex gap-6 h-full items-start">
          
          {/* Column: To Do */}
          <TaskColumn
            key={serializedTasks.map((task: any) => task._id).join('|')}
            title="To Do"
            initialTasks={serializedTasks}
          />
          

          {/* You can add "In Progress" or "Done" columns here easily now! */}
        </div>
      </main>
    </div>
  );
}