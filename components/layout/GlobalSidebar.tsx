import Link from 'next/link';
import { 
  LayoutDashboard, MessageSquare, Activity, FlaskConical, 
  TrendingUp, History, Settings, Shield, BrainCircuit, FileSearch 
} from 'lucide-react';

export default function GlobalSidebar() {
  const navItems = [
    { name: 'Mission Control', href: '/', icon: LayoutDashboard },
    { name: 'Copilot', href: '/copilot', icon: MessageSquare },
    { name: 'Infrastructure', href: '/infrastructure', icon: Activity },
    { name: 'Simulator', href: '/simulator', icon: FlaskConical },
    { name: 'Business Impact', href: '/impact', icon: TrendingUp },
    { name: 'Incident Center', href: '/incidents', icon: History },
    { name: 'Policy & Safety', href: '/policy', icon: Shield },
    { name: 'RL Insights', href: '/learning', icon: BrainCircuit },
    { name: 'Audit Log', href: '/audit', icon: FileSearch },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800 h-screen flex flex-col hidden md:flex fixed left-0 top-0">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Auto-SRE</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.name} href={item.href} className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md transition-colors">
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
      {/* 0.3 Left Sidebar: Global Engine Status Snippet */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <div className="text-xs font-mono text-zinc-500 mb-2 uppercase">Autonomy State</div>
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Full Autonomy Active
        </div>
      </div>
    </aside>
  );
}