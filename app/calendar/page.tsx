import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import TaskCard from "@/components/TaskCard";
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

export default async function CalendarPage() {
  const session = await auth();
  await connectDB();
  
  // Aligning query with My Tasks page for reliability
  const allTasks = await Task.find({ userId: session?.user?.id }).sort({ dueDate: 1 }).lean();
  
  // Filter for tasks that have a valid dueDate
  const tasks = allTasks.filter((t: any) => t.dueDate && !isNaN(new Date(t.dueDate).getTime()));

  // Group tasks by date string
  const groupedTasks: { [key: string]: any[] } = {};
  tasks.forEach((task: any) => {
    const d = new Date(task.dueDate);
    const dateStr = d.toDateString();
    if (!groupedTasks[dateStr]) groupedTasks[dateStr] = [];
    groupedTasks[dateStr].push(task);
  });

  const dates = Object.keys(groupedTasks);

  return (
    <div className="flex-1 overflow-y-auto bg-[#1d1d1d]">
      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Schedule</h1>
            <p className="text-gray-500">Your upcoming deadlines and planned activities.</p>
          </div>
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-600/20">
            <CalendarIcon size={24} className="text-blue-500" />
          </div>
        </header>

        <div className="space-y-10 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
          {dates.map((date) => (
            <div key={date} className="relative pl-10">
              {/* Date Marker */}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-[#1d1d1d] border-4 border-blue-600 flex items-center justify-center z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              <div className="flex items-center gap-2 mb-6">
                 <h2 className="text-lg font-bold text-gray-200">{date}</h2>
                 <ChevronRight size={16} className="text-gray-600" />
                 <span className="text-sm text-gray-500">{groupedTasks[date].length} tasks</span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {groupedTasks[date].map((task: any) => (
                  <TaskCard key={task._id.toString()} task={JSON.parse(JSON.stringify(task))} />
                ))}
              </div>
            </div>
          ))}

          {dates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center ml-10">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <CalendarIcon size={32} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-300">No scheduled tasks</h3>
              <p className="text-gray-500 max-w-xs">Add due dates to your tasks to see them in the calendar view.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
