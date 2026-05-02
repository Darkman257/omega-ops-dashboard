import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, Mail, Briefcase, Calendar, ShieldCheck } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 bg-card/50 border-white/10 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">AD</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">Admin User</h2>
            <p className="text-sm text-muted-foreground mb-4">Executive Manager</p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Edit Profile</Button>
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
                <p className="text-sm font-medium">admin@omega.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-white/5 border border-white/5">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Department</p>
                <p className="text-sm font-medium">Executive Office</p>
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
