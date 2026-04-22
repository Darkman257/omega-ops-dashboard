import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  FileText, 
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const [location] = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: Briefcase },
    { name: 'Staff', path: '/staff', icon: Users },
    { name: 'Documents', path: '/documents', icon: FileText },
    { name: 'Import', path: '/import', icon: Upload },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="h-screen sticky top-0 bg-sidebar border-r border-white/10 flex flex-col z-20 backdrop-blur-sm shadow-[0_0_20px_rgba(201,168,76,0.03)]"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
        {!collapsed && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold tracking-tighter border border-primary/20">
              ΩT
            </div>
            <span className="font-semibold text-base tracking-tight text-foreground leading-tight">Omega Technical<br/>Contracting</span>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold tracking-tighter border border-primary/20">
              ΩT
            </div>
          </div>
        )}
      </div>

      <div className="p-4 flex justify-end">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground h-8 w-8" 
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} data-testid={`link-nav-${item.name.toLowerCase()}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"
                  />
                )}
                <item.icon size={20} className={cn("shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.name}</span>}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5 text-muted-foreground hover:text-foreground",
          collapsed ? "justify-center" : ""
        )}>
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </div>
        
        <div className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-white/5 border border-white/5 mt-2",
          collapsed ? "justify-center" : ""
        )}>
          <Avatar className="h-8 w-8 rounded-md border border-white/10">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-md">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">Admin User</p>
              <p className="text-xs text-muted-foreground truncate">Executive</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
