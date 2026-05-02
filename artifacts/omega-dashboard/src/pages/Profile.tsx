import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { User, Mail, Briefcase, ShieldCheck, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { currentUser, updateUser } = useAppContext();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    role: currentUser.role,
    email: currentUser.email,
    department: currentUser.department,
  });

  const handleSave = () => {
    updateUser(formData);
    setOpen(false);
    toast({
      title: "Profile Updated",
      description: "Your information has been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mx-auto mb-4">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-7 w-7 rounded-full border border-white/10">
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <h2 className="text-xl font-bold">{currentUser.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">{currentUser.role}</p>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Edit Profile</Button>
              </DialogTrigger>
              <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile information here. Click save when you're done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Job Title</Label>
                    <Input id="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dept">Department</Label>
                    <Input id="dept" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="bg-white/5 border-white/10" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10 hover:bg-white/5">Cancel</Button>
                  <Button onClick={handleSave}>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Information Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Email Address</p>
                <p className="text-sm font-medium">{currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Department</p>
                <p className="text-sm font-medium">{currentUser.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Access Level</p>
                <p className="text-sm font-medium">System Administrator</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
