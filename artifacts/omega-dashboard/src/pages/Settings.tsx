import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Shield, Palette, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { theme, setTheme } = useTheme();

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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <SettingsIcon className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">General Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Configure system-wide parameters and regional settings.</p>
            <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5">Configure</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Shield className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Security & RLS</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Manage access controls and data security policies.</p>
            <Button variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5">Manage</Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Palette className="h-4 w-4 text-primary mr-2" />
            <CardTitle className="text-sm font-medium">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Customize the dashboard theme and visual elements.</p>
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
    </div>
  );
};

export default Settings;
