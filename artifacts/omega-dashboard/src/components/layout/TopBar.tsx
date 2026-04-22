import React from 'react';
import { Search, Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';

interface TopBarProps {
  onSearchOpen: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchOpen }) => {
  const { projects, siteFilter, setSiteFilter } = useAppContext();

  return (
    <header className="h-16 border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-6 gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
          <MapPin size={13} className="text-primary" />
          <span className="hidden sm:inline">Site</span>
        </div>
        <Select value={siteFilter || '__all__'} onValueChange={(v) => setSiteFilter(v === '__all__' ? '' : v)}>
          <SelectTrigger
            className="h-8 w-[220px] bg-white/5 border-white/10 text-sm focus:ring-primary/30 hover:border-primary/30 transition-colors"
            data-testid="select-site-filter"
          >
            <SelectValue>
              {siteFilter
                ? <span className="text-primary font-medium truncate">{siteFilter}</span>
                : <span className="text-muted-foreground">All Sites</span>
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">
              <span className="text-muted-foreground">All Sites</span>
            </SelectItem>
            {projects.map(p => (
              <SelectItem key={p.id} value={p.name}>
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.location}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {siteFilter && (
          <button
            onClick={() => setSiteFilter('')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 flex-shrink-0"
          >
            clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="outline"
          className="bg-white/5 border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 hidden md:flex items-center gap-2 w-56 justify-start px-3 h-9"
          onClick={onSearchOpen}
          data-testid="button-search"
        >
          <Search size={15} />
          <span className="text-sm font-normal">Search command center...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative h-9 w-9">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-primary rounded-full" />
        </Button>
      </div>
    </header>
  );
};
