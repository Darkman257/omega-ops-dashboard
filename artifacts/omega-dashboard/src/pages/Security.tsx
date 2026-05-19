import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Eye, VideoOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function Security() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Security</h1>
        <p className="text-xs text-muted-foreground mt-1">Administrative security interface placeholder</p>
      </div>

      <Card className="bg-white/5 border-white/10 max-w-2xl overflow-hidden relative">
        <div className="absolute inset-0 opacity-5 bg-gradient-to-b from-amber-500 to-transparent pointer-events-none" />
        <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
            <ShieldAlert size={18} />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground">Operational Status</CardTitle>
            <p className="text-[10px] text-muted-foreground">Reserved Module Gateway</p>
          </div>
          <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] uppercase tracking-widest font-black">
            Reserved / Pending Requirements
          </Badge>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-950/30 rounded-xl border border-white/5 p-6">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-muted-foreground">
              <VideoOff size={20} />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-md">
              Security module is reserved for administrative security and site monitoring. Awaiting camera quotation and owner requirements.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
