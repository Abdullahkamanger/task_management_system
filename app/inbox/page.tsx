import { auth } from "@/auth";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import TaskCard from "@/components/TaskCard";
import { Inbox, Zap, ListTodo, History } from 'lucide-react';

export default async function InboxPage() {
  const session = await auth();
  await connectDB();
  
  // Fetch tasks with no due date (Unscheduled)
  const unscheduledTasks = await Task.find({ 
    userId: session?.user?.id,
    dueDate: null 
  }).sort({ createdAt: -1 }).limit(10).lean();

  // Fetch recently updated tasks (Activity)
  const recentActivity = await Task.find({ 
    userId: session?.user?.id 
  }).sort({ updatedAt: -1 }).limit(10).lean();

  return (
    <div className="flex-1 overflow-y-auto bg-[#1d1d1d]">
      <div className="max-w-5xl mx-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Inbox</h1>
          <p className="text-gray-500">Recently added tasks and items requiring your attention.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Unscheduled Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <ListTodo size={20} className="text-purple-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-200">Unscheduled Tasks</h2>
                <p className="text-xs text-gray-500">Items that need a deadline</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {unscheduledTasks.map((task: any) => (
                <TaskCard key={task._id.toString()} task={JSON.parse(JSON.stringify(task))} />
              ))}
              {unscheduledTasks.length === 0 && (
                <div className="p-8 border border-dashed border-white/5 rounded-xl text-center">
                  <p className="text-sm text-gray-500">Everything is scheduled! Nice work.</p>
                </div>
              )}
            </div>
          </section>

          {/* Activity Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <History size={20} className="text-orange-400" />
              </div>
              <div>
                <h2 className="font-bold text-gray-200">Recent Activity</h2>
                <p className="text-xs text-gray-500">Your latest changes</p>
              </div>
            </div>

            <div className="space-y-3">
              {recentActivity.map((task: any) => (
                <div key={task._id.toString()} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-all group">
                   <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Zap size={14} className="text-blue-400" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-medium truncate">{task.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Updated {new Date(task.updatedAt).toLocaleDateString()} at {new Date(task.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                   <div className={`text-[10px] px-2 py-0.5 rounded ${task.completed ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {task.completed ? 'Done' : task.column}
                   </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="p-8 border border-dashed border-white/5 rounded-xl text-center">
                  <p className="text-sm text-gray-500">No recent activity found.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
