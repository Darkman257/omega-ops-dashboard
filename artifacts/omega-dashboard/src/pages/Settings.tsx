import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Palette, 
  Moon, 
  Sun, 
  CheckCircle2, 
  Database,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppContext } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { projects, loading } = useAppContext();
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast({
      title: "Theme Changed",
      description: `Interface switched to ${newTheme} mode.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* General Settings - Site Management */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <SettingsIcon size={80} />
          </div>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <SettingsIcon className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Site Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 mb-4">
              <span className="text-2xl font-bold text-primary">{projects.length}</span>
              <span className="text-xs text-muted-foreground ml-2 uppercase tracking-widest">Active Sites</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5">Manage Sites</Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                  <DialogTitle>Active Project Sites</DialogTitle>
                  <DialogDescription>
                    List of all operational sites currently in the system.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {projects.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-primary" />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.location}</p>
                        </div>
                      </div>
                      <CheckCircle2 size={14} className="text-green-500" />
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Security & Supabase Status */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Shield size={80} />
          </div>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Security & Cloud</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2 mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium">Supabase Connected</span>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5">Connection Status</Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10">
                <DialogHeader>
                  <DialogTitle>Database Health</DialogTitle>
                  <DialogDescription>Technical status of the live data layer.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-sm">Row Level Security (RLS)</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-500 font-bold uppercase tracking-tighter">Active</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-sm">Supabase Region</span>
                    <span className="text-xs text-muted-foreground">EU (Frankfurt)</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                    <span className="text-sm">Latency</span>
                    <span className="text-xs text-green-500">42ms</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Appearance - Theme Switching */}
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Palette size={80} />
          </div>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Palette className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Interface Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Toggle between dark and light modes for optimal viewing.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-white/10 hover:bg-white/5 flex items-center justify-center gap-2"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Info Footer */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-4 w-4 text-primary" />
          <p className="text-xs font-medium text-muted-foreground">OMEGA TECHNICAL CONTRACTING <span className="text-primary/50 mx-2">|</span> VERSION 1.0.0-MVP</p>
        </div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">Truth-Lock Active</div>
      </div>
    </div>
  );
};

export default Settings;
