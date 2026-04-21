import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TopBarProps {
  onSearchOpen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchOpen }) => {
  return (
    <header className="h-16 border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        {/* Breadcrumb could go here */}
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          className="bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 hidden md:flex items-center gap-2 w-64 justify-start px-3 h-9"
          onClick={onSearchOpen}
          data-testid="button-search"
        >
          <Search size={16} />
          <span className="text-sm font-normal">Search command center...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
};
