import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Search, User, Phone, Mail, 
  ExternalLink, Copy, Calendar, MessageSquare,
  Clock, MapPin, Briefcase, Info, ChevronRight,
  ArrowRight, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { useAppContext, OnboardingQueueEntry } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription 
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';

export default function RecruitmentOnboarding() {
  const { onboardingQueue, loading } = useAppContext();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<OnboardingQueueEntry | null>(null);

  const filteredQueue = onboardingQueue.filter(entry => {
    const payload = entry.mappedPayload;
    const searchLower = search.toLowerCase();
    return (
      payload.full_name?.toLowerCase().includes(searchLower) ||
      payload.phone?.includes(search) ||
      payload.job_title?.toLowerCase().includes(searchLower) ||
      payload.position?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_omega_review':
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-2 py-0.5 text-[10px] uppercase font-bold">Pending Review</Badge>;
      case 'needs_data':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-2 py-0.5 text-[10px] uppercase font-bold">Needs Data</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-2 py-0.5 text-[10px] uppercase font-bold">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-2 py-0.5 text-[10px] uppercase font-bold">Rejected</Badge>;
      default:
        return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 px-2 py-0.5 text-[10px] uppercase font-bold">{status}</Badge>;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied`,
      description: text,
    });
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-primary/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground animate-pulse font-mono text-xs tracking-widest uppercase">Initializing Interface...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ClipboardList className="text-primary h-8 w-8" />
            Recruitment Onboarding
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Review candidates accepted from Recruitment Hub.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search queue..." 
              className="pl-9 h-10 bg-white/5 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {onboardingQueue.length === 0 ? (
        <Card className="bg-white/5 border-white/10 border-dashed py-20">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <User className="text-primary/40 h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-1">No recruitment candidates pending onboarding</h3>
            <p className="text-muted-foreground max-w-sm">
              When candidates are marked as 'Accepted' in the Recruitment Hub, they will appear here for review and onboarding.
            </p>
          </CardContent>
        </Card>
      ) : filteredQueue.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No matches found for "{search}"</p>
          <Button variant="link" onClick={() => setSearch('')}>Clear search</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredQueue.map((entry, idx) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card 
                  className="bg-white/5 border-white/10 hover:border-primary/30 transition-all group cursor-pointer overflow-hidden relative"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      {getStatusBadge(entry.onboardingStatus)}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {entry.mappedPayload.full_name}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Briefcase size={12} />
                          {entry.mappedPayload.job_title || entry.mappedPayload.position || 'No role specified'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone size={14} className="text-primary/60" />
                          <span>{entry.mappedPayload.phone}</span>
                        </div>
                        {entry.mappedPayload.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                            <Mail size={14} className="text-primary/60" />
                            <span className="truncate">{entry.mappedPayload.email}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-white/5">
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock size={10} />
                          Queued: {new Date(entry.createdAt).toLocaleDateString()}
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Details Sheet */}
      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-md bg-zinc-950 border-white/10 p-0 text-foreground overflow-hidden flex flex-col">
          {selectedEntry && (
            <>
              <div className="h-32 bg-primary/5 relative flex-shrink-0">
                <div className="absolute -bottom-10 left-6">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-2xl overflow-hidden">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white"
                    onClick={() => setSelectedEntry(null)}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              <div className="pt-12 px-6 pb-6 flex-1 overflow-y-auto">
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(selectedEntry.onboardingStatus)}
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      ID: {selectedEntry.id.split('-')[0]}
                    </span>
                  </div>
                  <SheetTitle className="text-2xl font-bold">{selectedEntry.mappedPayload.full_name}</SheetTitle>
                  <SheetDescription className="text-primary font-medium flex items-center gap-1.5 mt-1">
                    <Briefcase size={14} />
                    {selectedEntry.mappedPayload.job_title || selectedEntry.mappedPayload.position}
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  {/* Contact Group */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="bg-white/5 border-white/10 h-12 justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => openWhatsApp(selectedEntry.mappedPayload.phone)}
                    >
                      <MessageSquare size={18} />
                      <div className="text-left">
                        <div className="text-[10px] uppercase text-muted-foreground">WhatsApp</div>
                        <div className="text-xs font-bold">Open Chat</div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-white/5 border-white/10 h-12 justify-start gap-3 hover:bg-primary/10 hover:text-primary transition-all"
                      onClick={() => copyToClipboard(selectedEntry.mappedPayload.phone, 'Phone')}
                    >
                      <Copy size={18} />
                      <div className="text-left">
                        <div className="text-[10px] uppercase text-muted-foreground">Phone</div>
                        <div className="text-xs font-bold">Copy Number</div>
                      </div>
                    </Button>
                  </div>

                  {/* Info Grid */}
                  <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/5">
                    <div className="p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                        <Info size={12} className="text-primary" />
                        Candidate Intelligence
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Source Channel</span>
                          <span className="text-xs font-medium text-foreground">{selectedEntry.mappedPayload.source || 'NEXUS Network'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Queued At</span>
                          <span className="text-xs font-medium text-foreground">
                            {selectedEntry.mappedPayload.queued_at 
                              ? new Date(selectedEntry.mappedPayload.queued_at).toLocaleString() 
                              : new Date(selectedEntry.createdAt).toLocaleString()
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Recruitment ID</span>
                          <span className="text-xs font-mono text-foreground uppercase">{selectedEntry.candidateId.split('-')[0]}</span>
                        </div>
                      </div>
                    </div>

                    {selectedEntry.mappedPayload.summary && (
                      <div className="p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-primary" />
                          Profile Summary
                        </h4>
                        <p className="text-xs text-foreground leading-relaxed italic">
                          "{selectedEntry.mappedPayload.summary}"
                        </p>
                      </div>
                    )}

                    {selectedEntry.mappedPayload.notes && (
                      <div className="p-4">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Recruiter Notes</h4>
                        <div className="text-xs text-muted-foreground bg-black/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                          {selectedEntry.mappedPayload.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary mt-0.5">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-primary mb-1">Operational Status</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        This candidate is currently in the **Preview Phase**. Staff record generation and project assignment will be available in the next lifecycle stage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-zinc-950 flex-shrink-0">
                <Button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground cursor-not-allowed group h-12" disabled>
                  <span>Awaiting Activation Engine</span>
                  <ArrowRight size={16} className="ml-2 opacity-30 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
