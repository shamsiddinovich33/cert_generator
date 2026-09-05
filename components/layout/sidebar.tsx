'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileCheck, 
  Settings, 
  History, 
  FileSpreadsheet,
  Award
} from 'lucide-react';

import { signOut } from 'next-auth/react';

export default function Sidebar() {
  const pathname = usePathname();

  if (pathname.startsWith('/auth')) {
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Templates', href: '/templates', icon: FileCheck },
    { name: 'Generate', href: '/generate', icon: FileSpreadsheet },
    { name: 'Certificates', href: '/certificates', icon: Award },
    { name: 'History', href: '/history', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-screen shrink-0 sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/20">
        <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-600/40">
          <Award className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-md font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Cert Generator
          </h1>
          <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">MVP Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = 
            item.href === '/' 
              ? pathname === '/' 
              : pathname.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-md shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <item.icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/10 space-y-2">
        <Link href="/profile" className="flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
          <Settings className="h-4 w-4 shrink-0" />
          <span>Mening profilim</span>
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center justify-center space-x-2 bg-slate-800/80 hover:bg-rose-900/50 hover:text-rose-400 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span>Chiqish</span>
        </button>
      </div>
    </aside>
  );
}
