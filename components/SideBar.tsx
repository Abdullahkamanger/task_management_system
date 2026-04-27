'use client';

import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Settings, 
  Inbox, 
  Star,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Board', href: '/' },
  { icon: Inbox, label: 'Inbox', href: '/inbox' },
  { icon: CheckSquare, label: 'My Tasks', href: '/tasks' },
  { icon: Calendar, label: 'Calendar', href: '/calendar' },
];

const favorites = [
  { label: 'Next.js Project', color: 'bg-blue-400' },
  { label: 'MERN Migration', color: 'bg-purple-400' },
];

export default function Sidebar({ user }: { user?: any }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#101204] border-r border-white/5 flex flex-col h-full shrink-0">
      {/* Profile / Workspace Name */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm text-white">
          {user?.name?.substring(0, 2).toUpperCase() || 'AK'}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-200 text-sm">Main Board</span>
          <span className="text-xs text-gray-500 truncate max-w-[150px]">{user?.email}</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-8 pb-2 px-3">
          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Favorites</p>
        </div>

        {favorites.map((fav) => (
          <button key={fav.label} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors group">
            <div className={`w-2 h-2 rounded-full ${fav.color}`} />
            <span className="text-sm">{fav.label}</span>
            <Star size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
          <Settings size={18} />
          <span className="text-sm">Settings</span>
        </button>
        <button 
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm">Log Out</span>
        </button>
      </div>
    </aside>
  );
}