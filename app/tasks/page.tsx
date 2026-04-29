import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import TaskCard from "@/components/TaskCard";
import MagicTaskInput from "@/components/MagicTaskInput";
import { CheckSquare, Calendar, AlertCircle, Clock } from 'lucide-react';

export default async function MyTasksPage() {
  const session = await auth();
  await connectDB();
  
  // Fetch all tasks for this user
  const tasks = await Task.find({ userId: session?.user?.id }).sort({ createdAt: -1 }).lean();

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdue = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d < now && !t.completed;
  });
  const today = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    if (isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() === now.getTime();
  });
  const upcoming = tasks.filter((t: any) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d > now;
  });
  const noDate = tasks.filter((t: any) => {
    if (!t.dueDate) return true;
    return isNaN(new Date(t.dueDate).getTime());
  });

  const sections = [
    { title: "Overdue", icon: AlertCircle, color: "text-red-400", tasks: overdue },
    { title: "Due Today", icon: Clock, color: "text-yellow-400", tasks: today },
    { title: "Upcoming", icon: Calendar, color: "text-blue-400", tasks: upcoming },
    { title: "No Due Date", icon: CheckSquare, color: "text-gray-400", tasks: noDate },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#1d1d1d]">
      <div className="max-w-5xl mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">My Tasks</h1>
          <p className="text-gray-500">Manage all your personal tasks across the workspace.</p>
        </header>

        <div className="mb-10">
          <MagicTaskInput />
        </div>

        <div className="space-y-12">
          {sections.map((section) => (
            section.tasks.length > 0 && (
              <section key={section.title}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon size={18} className={section.color} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    {section.title} ({section.tasks.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.tasks.map((task: any) => (
                    <TaskCard key={task._id.toString()} task={JSON.parse(JSON.stringify(task))} />
                  ))}
                </div>
              </section>
            )
          ))}

          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <CheckSquare size={32} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-300">No tasks yet</h3>
              <p className="text-gray-500 max-w-xs">Use the creator above to start organizing your work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
