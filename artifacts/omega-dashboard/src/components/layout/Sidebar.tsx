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
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const OmegaLogo = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" stroke="#C9A84C" strokeWidth="1.5" opacity="0.6" />
    <circle cx="30" cy="30" r="24" stroke="#C9A84C" strokeWidth="0.75" opacity="0.3" />
    <path
      d="M20.5 42C15.5 42 12 38 12 32C12 22 20 14 30 14C40 14 48 22 48 32C48 38 44.5 42 39.5 42L39.5 45L43 45L43 47L17 47L17 45L20.5 45Z"
      stroke="#C9A84C"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="30" cy="10" r="2" fill="#C9A84C" opacity="0.8" />
    <line x1="27" y1="10" x2="22" y2="10" stroke="#C9A84C" strokeWidth="1" opacity="0.5" />
    <line x1="33" y1="10" x2="38" y2="10" stroke="#C9A84C" strokeWidth="1" opacity="0.5" />
  </svg>
);

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
      animate={{ width: collapsed ? 80 : 268 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-screen sticky top-0 bg-sidebar border-r border-white/10 flex flex-col z-20 backdrop-blur-sm shadow-[0_0_20px_rgba(201,168,76,0.03)] overflow-hidden"
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2.5 min-w-0"
          >
            <OmegaLogo size={34} />
            <div className="min-w-0">
              <div className="text-primary font-bold text-sm tracking-wide leading-tight">OMEGA</div>
              <div className="text-muted-foreground text-[10px] tracking-widest uppercase leading-tight">Technical Contracting</div>
            </div>
          </motion.div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <OmegaLogo size={32} />
          </div>
        )}
      </div>

      <div className="px-3 pt-3 pb-1 flex justify-end flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground h-7 w-7"
          onClick={() => setCollapsed(!collapsed)}
          data-testid="button-toggle-sidebar"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-2">
        {navItems.map((item, i) => {
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link key={item.path} href={item.path} data-testid={`link-nav-${item.name.toLowerCase()}`}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full"
                  />
                )}
                <item.icon
                  size={18}
                  className={cn('shrink-0', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')}
                />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1 flex-shrink-0">
        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-white/5 text-muted-foreground hover:text-foreground',
          collapsed ? 'justify-center' : ''
        )}>
          <Settings size={18} />
          {!collapsed && <span className="text-sm">Settings</span>}
        </div>

        <div className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5',
          collapsed ? 'justify-center' : ''
        )}>
          <Avatar className="h-7 w-7 rounded-md border border-white/10 flex-shrink-0">
            <AvatarFallback className="bg-primary/20 text-primary text-xs rounded-md font-bold">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">Admin User</p>
              <p className="text-[10px] text-muted-foreground truncate">Executive</p>
            </motion.div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};
