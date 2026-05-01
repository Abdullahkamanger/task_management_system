import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import TaskCard from "@/components/TaskCard";
import MagicTaskInput from "@/components/MagicTaskInput";
import InlineTaskCreator from "@/components/InlineTaskCreator";
import { CheckSquare, Calendar, AlertCircle, Clock, Plus, Sparkles } from 'lucide-react';

export default async function MyTasksPage() {
  const session = await auth();
  await connectDB();
  
  // Fetch all tasks for this user
  const tasksRaw = await Task.find({ userId: session?.user?.id }).sort({ createdAt: -1 }).lean();
  
  const tasks = tasksRaw.map((t: any) => ({
    ...JSON.parse(JSON.stringify(t)),
    _id: t._id.toString(),
    userId: t.userId.toString(),
    parentId: t.parentId ? t.parentId.toString() : null,
    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
  }));

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
    if (isNaN(d.getTime())) return false;
    d.setHours(0, 0, 0, 0);
    return d.getTime() > now.getTime();
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={16} className="text-purple-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Task Maker</h3>
            </div>
            <MagicTaskInput />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Plus size={16} className="text-blue-400" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Manual Task Adder</h3>
            </div>
            <InlineTaskCreator className="!mb-0 h-[60px]" placeholder="Add task manually..." />
          </div>
        </div>

        <div className="space-y-12">
          {sections.map((section) => (
            section.tasks.length > 0 && (
              <section key={section.title}>
                <div className="flex items-center gap-2 mb-4">
                  <section.icon size={18} className={section.color} />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                    {section.title} ({section.tasks.filter((t: any) => !t.parentId).length})
                  </h2>
                </div>
                <div className="flex flex-col gap-4 pl-6">
                  {(() => {
                    const sectionTasks = section.tasks.filter((t: any) => !t.parentId);
                    return sectionTasks.map((task: any) => (
                      <TaskCard 
                        key={task._id.toString()} 
                        task={JSON.parse(JSON.stringify(task))} 
                        allTasks={JSON.parse(JSON.stringify(tasks))} 
                      />
                    ));
                  })()}
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
