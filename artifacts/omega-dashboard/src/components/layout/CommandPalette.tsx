import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { useAppContext } from '@/context/AppContext';
import { Briefcase, Users, FileText, Search } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
  const [, setLocation] = useLocation();
  const { projects, employees, documents } = useAppContext();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setOpen]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, staff, documents..." />
      <CommandList className="max-h-[300px] overflow-y-auto">
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => setLocation('/'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setLocation('/import'))}>
            <Search className="mr-2 h-4 w-4" />
            <span>Import Data</span>
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.slice(0, 5).map(project => (
              <CommandItem 
                key={project.id} 
                onSelect={() => runCommand(() => setLocation('/projects'))}
              >
                <Briefcase className="mr-2 h-4 w-4 text-primary" />
                <span>{project.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{project.client}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {employees.length > 0 && (
          <CommandGroup heading="Staff">
            {employees.slice(0, 5).map(emp => (
              <CommandItem 
                key={emp.id} 
                onSelect={() => runCommand(() => setLocation('/staff'))}
              >
                <Users className="mr-2 h-4 w-4 text-blue-400" />
                <span>{emp.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{emp.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {documents.length > 0 && (
          <CommandGroup heading="Documents">
            {documents.slice(0, 5).map(doc => (
              <CommandItem 
                key={doc.id} 
                onSelect={() => runCommand(() => setLocation('/documents'))}
              >
                <FileText className="mr-2 h-4 w-4 text-orange-400" />
                <span>{doc.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{doc.type}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
