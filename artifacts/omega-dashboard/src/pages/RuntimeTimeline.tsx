import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Clock, Search, ShieldAlert, Cpu, Terminal as TerminalIcon,
  ChevronRight, RefreshCw, Layers, Sparkles, Filter, CheckCircle2,
  Users, Truck, Home, ClipboardList, ShieldCheck, Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from "@/lib/utils";

interface RuntimeEvent {
  id: string;
  timestamp: string;
  source: string;
  module: string;
  event_type: string;
  title: string;
  description: string;
  entity_type: string;
  entity_id: string;
  actor: string;
  severity: 'info' | 'warning' | 'critical' | 'resolved';
  status?: string;
  metadata?: any;
}

interface AskResponse {
  query: string;
  summary: string;
  matchedModules: string[];
  relatedEvents: RuntimeEvent[];
  recommendedNextAction: string;
  confidence: string;
}

const moduleIcons: Record<string, React.ElementType> = {
  Recruitment: Users,
  Staff: Users,
  Fleet: Truck,
  Housing: Home,
  Tasks: ClipboardList,
  Clearance: ShieldCheck,
  Compliance: ShieldAlert,
  Telegram: Zap
};

const severityStyles: Record<string, string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  warning: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  resolved: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  info: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
};

const severityGlows: Record<string, string> = {
  critical: 'shadow-[0_0_10px_rgba(239,68,68,0.6)] bg-red-500',
  warning: 'shadow-[0_0_8px_rgba(245,158,11,0.5)] bg-amber-500',
  resolved: 'shadow-[0_0_8px_rgba(16,185,129,0.5)] bg-emerald-500',
  info: 'shadow-[0_0_8px_rgba(6,182,212,0.5)] bg-cyan-500'
};

export default function RuntimeTimeline() {
  const [events, setEvents] = useState<RuntimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState<RuntimeEvent | null>(null);

  // Ask NEXUS states
  const [query, setQuery] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [askResult, setAskResult] = useState<AskResponse | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const response = await fetch('/api/runtime/events', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!response.ok) throw new Error();
      const list = await response.json();
      setEvents(list);
    } catch (err) {
      console.warn("Express API failed, fetching direct from Supabase client...");
      // Resilient backup query directly through client
      try {
        const [onbRes, staffRes, taskRes] = await Promise.all([
          supabase.from('recruitment_onboarding_queue').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('staff').select('*').order('created_at', { ascending: false }).limit(20),
          supabase.from('site_admin_tasks').select('*').order('created_at', { ascending: false }).limit(20)
        ]);

        const backup: RuntimeEvent[] = [];
        (onbRes.data || []).forEach(q => {
          const p = q.mapped_payload || {};
          backup.push({
            id: `evt-rec-${q.id}`,
            timestamp: q.created_at,
            source: 'Recruitment',
            module: 'Recruitment',
            event_type: 'onboarding_queued',
            title: 'Candidate Queued for Onboarding',
            description: `${p.full_name || 'Candidate'} queued as ${p.job_title || 'Worker'}. Status: ${q.onboarding_status}`,
            entity_type: 'recruitment_onboarding_queue',
            entity_id: q.id,
            actor: 'System',
            severity: q.onboarding_status === 'pending_omega_review' ? 'warning' : 'info',
            metadata: q
          });
        });
        (staffRes.data || []).forEach(s => {
          backup.push({
            id: `evt-stf-${s.id}`,
            timestamp: s.created_at,
            source: 'Staff',
            module: 'Staff',
            event_type: 'staff_status',
            title: `Staff File: ${s.full_name}`,
            description: `Job Code: ${s.internal_code} | Department: ${s.department} | Lifecycle: ${s.lifecycle_status}`,
            entity_type: 'staff',
            entity_id: s.id,
            actor: 'System',
            severity: 'info',
            metadata: s
          });
        });
        (taskRes.data || []).forEach(t => {
          backup.push({
            id: `evt-tsk-${t.id}`,
            timestamp: t.created_at,
            source: 'Operations',
            module: 'Tasks',
            event_type: 'task_updated',
            title: `Site Task: ${t.task_title}`,
            description: `Priority: ${t.priority} | Status: ${t.status}`,
            entity_type: 'site_admin_tasks',
            entity_id: t.id,
            actor: 'Admin',
            severity: t.priority === 'critical' ? 'critical' : 'info',
            metadata: t
          });
        });
        setEvents(backup.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (sbErr) {
        console.error("Critical: Telemetry retrieval error.", sbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAsk = async (textQuery: string) => {
    const qText = textQuery.trim();
    if (!qText) return;
    setQuery(qText);
    setAskLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      const response = await fetch(`/api/runtime/ask?q=${encodeURIComponent(qText)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error();
      const resData = await response.json();
      setAskResult(resData);

      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.warn("Ask Gateway error. Generating local response fallback.");
      // Local deterministic response engine
      const queryLower = qText.toLowerCase();
      let summary = "";
      let matchedModules: string[] = [];
      let nextAction = "";

      if (queryLower.includes('onboarding') || queryLower.includes('recruit')) {
        summary = "Local telemetry fallback: Recruitment records match query. Filtered recent candidates in onboarding pipeline.";
        matchedModules = ["Recruitment"];
        nextAction = "Verify candidates pending Omega reviews directly in the Recruitment Onboarding portal.";
      } else {
        summary = `Local telemetry match: Diagnostic scanner matched related records in operational logs for '${qText}'.`;
        matchedModules = ["Ecosystem"];
        nextAction = "Enter specific keywords like 'staff', 'fleet', 'housing', or 'onboarding' for granular intelligence reports.";
      }

      setAskResult({
        query: qText,
        summary: summary,
        matchedModules,
        relatedEvents: events.filter(e => matchedModules.includes(e.module)).slice(0, 10),
        recommendedNextAction: nextAction,
        confidence: "deterministic"
      });
    } finally {
      setAskLoading(false);
    }
  };

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.description.toLowerCase().includes(search.toLowerCase()) ||
                          e.module.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'All' || e.severity === severityFilter.toLowerCase();
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6 relative pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="text-cyan-400 animate-pulse" size={24} />
            <h1 className="text-3xl font-bold tracking-wider uppercase text-foreground neon-text-cyan">Ecosystem Runtime Core</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1 font-mono">Telemetry Aggregator // Live Operational Log Streams</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/10 hover:bg-white/5 font-mono text-xs gap-1.5" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Sync Telemetry
          </Button>
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <Cpu size={12} className="animate-pulse" />
            Core Status: Optimal
          </div>
        </div>
      </div>

      {/* Ask NEXUS V1 Terminal Panel */}
      <Card className="bg-black/60 border-white/10 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <TerminalIcon size={120} className="text-cyan-400" />
        </div>
        <CardHeader className="border-b border-white/5 py-3">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <TerminalIcon size={14} className="text-cyan-400" /> Ask NEXUS Console
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            NEXUS Core local deterministic query processor. Inject operational queries below to inspect counts, anomalies, and active bottlenecks.
          </p>

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. onboarding, active staff, fleet unassigned driver, today..."
              className="bg-black/50 border-white/10 font-mono text-xs text-cyan-300 placeholder:text-muted-foreground/45 focus-visible:ring-cyan-500 focus-visible:ring-1"
              onKeyDown={e => e.key === 'Enter' && handleAsk(query)}
            />
            <Button onClick={() => handleAsk(query)} className="bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-400 font-mono text-xs" disabled={askLoading}>
              Execute
            </Button>
          </div>

          {/* Quick-action search chips */}
          <div className="flex flex-wrap gap-2 text-[10px] font-mono">
            {['onboarding', 'workforce', 'fleet readiness', 'housing density', 'approvals', 'today'].map(chip => (
              <button
                key={chip}
                onClick={() => handleAsk(chip)}
                className="px-2 py-1 rounded bg-white/5 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/5 text-muted-foreground hover:text-cyan-300 transition-colors"
              >
                #{chip}
              </button>
            ))}
          </div>

          {/* Terminal Results */}
          <AnimatePresence>
            {(askLoading || askResult) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 rounded-lg bg-black/85 border border-cyan-500/15 font-mono text-xs space-y-4 shadow-[inset_0_0_15px_rgba(6,182,212,0.03)]"
              >
                {askLoading ? (
                  <div className="flex items-center gap-2 text-cyan-400/70 animate-pulse">
                    <span className="w-1.5 h-3 bg-cyan-400 animate-ping"></span>
                    <span>PROCESSING DETERMINISTIC TELEMETRY LAYER...</span>
                  </div>
                ) : askResult && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/60 border-b border-white/5 pb-2">
                      <span>NEXUS-DAEMON // RESOLUTION OK</span>
                      <span className="text-cyan-400 flex items-center gap-1"><Sparkles size={10} /> CONFIDENCE: {askResult.confidence.toUpperCase()}</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-cyan-500 font-black uppercase tracking-widest block">Operational Diagnosis:</span>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap pl-2 border-l border-cyan-500/20">{askResult.summary}</p>
                    </div>

                    {askResult.recommendedNextAction && (
                      <div className="p-2.5 rounded bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">Recommended Next Action:</span>
                        <p className="text-[11px] text-amber-200/90 leading-normal">{askResult.recommendedNextAction}</p>
                      </div>
                    )}

                    {askResult.matchedModules.length > 0 && (
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-[9px] text-muted-foreground uppercase">Associated Modules:</span>
                        <div className="flex gap-1.5">
                          {askResult.matchedModules.map(m => (
                            <Badge key={m} variant="outline" className="text-[9px] border-white/10 font-bold text-cyan-400 uppercase">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div ref={terminalEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Grid: Timeline and Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Filter and Timeline Feed */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="bg-black/40 border-white/5 backdrop-blur-sm">
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter timeline events..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/5 text-xs focus-visible:ring-1 focus-visible:ring-cyan-500/30"
                />
              </div>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-white/5 border-white/5 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Filter size={12} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 text-xs">
                  {['All', 'Info', 'Warning', 'Critical', 'Resolved'].map(item => (
                    <SelectItem key={item} value={item} className="focus:bg-cyan-500/10 focus:text-cyan-300 font-mono">{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Timeline Feed Container */}
          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1 custom-scrollbar relative pl-5 border-l border-white/5">
            {loading ? (
              <div className="py-20 text-center text-xs font-mono text-cyan-400/60 animate-pulse">
                SYNCHRONIZING SECURE TELEMETRY FEED...
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-20 text-center">
                <Radio className="mx-auto text-cyan-400/20 mb-3 animate-ping" size={32} />
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Ecosystem Timeline Silent</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">No telemetry updates found for the selected filter criteria.</p>
              </div>
            ) : (
              filteredEvents.map((evt, idx) => {
                const IconComp = moduleIcons[evt.module] || Radio;
                const activeStyles = selectedEvent?.id === evt.id ? 'border-cyan-500/30 bg-cyan-500/5 shadow-[0_0_12px_rgba(6,182,212,0.04)]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10';

                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={cn(
                      "p-4 rounded-xl border transition-all cursor-pointer flex flex-col gap-3 relative group",
                      activeStyles
                    )}
                  >
                    {/* Timeline Node */}
                    <div className="absolute left-[-26px] top-4.5 w-3 h-3 rounded-full bg-black border border-white/10 flex items-center justify-center">
                      <div className={cn("w-1.5 h-1.5 rounded-full", severityGlows[evt.severity])} />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</span>
                        <span className="text-[9px] font-mono text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-500/5 uppercase border border-cyan-500/10">
                          {evt.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 self-start sm:self-auto">
                        <Badge className={cn('text-[9px] border font-bold uppercase tracking-wider', severityStyles[evt.severity])}>
                          {evt.severity}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className={cn("p-2 rounded-lg shrink-0 self-start border", severityStyles[evt.severity].split(' ')[2])}>
                        <IconComp size={16} />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-semibold text-sm text-foreground group-hover:text-cyan-400 transition-colors truncate">{evt.title}</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed leading-snug">{evt.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Inspector Drawer */}
        <div className="lg:col-span-4">
          <Card className="bg-black/60 border-white/10 backdrop-blur-md sticky top-6">
            <CardHeader className="border-b border-white/5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Layers size={14} className="text-cyan-400" /> Telemetry Inspector
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Entity Module</span>
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Radio size={14} className="text-cyan-400" /> {selectedEvent.module}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Registered System ID</span>
                    <div className="text-xs font-mono text-cyan-400 font-bold truncate">
                      {selectedEvent.entity_id}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">State Validator Actor</span>
                    <div className="text-xs text-foreground font-mono">
                      {selectedEvent.actor}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Event Description</span>
                    <p className="text-xs text-foreground bg-white/5 border border-white/5 p-3 rounded-lg leading-relaxed leading-snug">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {/* Raw Metadata JSON block */}
                  {selectedEvent.metadata && (
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Telemetry Metadata Payload</span>
                      <pre className="p-3 bg-black border border-white/5 rounded-lg text-[10px] font-mono text-emerald-400/90 overflow-x-auto max-h-[220px] custom-scrollbar">
                        {JSON.stringify(selectedEvent.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Dynamic page direct deep links */}
                  <div className="pt-2">
                    {selectedEvent.module === 'Recruitment' && (
                      <a href="/recruitment-onboarding" className="w-full text-center block py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-[11px]">
                        Inspect Recruitment Drawer
                      </a>
                    )}
                    {selectedEvent.module === 'Staff' && (
                      <a href={`/staff`} className="w-full text-center block py-2 rounded bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-[11px]">
                        Open Workforce Records
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center">
                  <Layers className="mx-auto text-muted-foreground/20 mb-3" size={32} />
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Select an Event</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Select any event from the timeline stream to view deep telemetry metadata blocks.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
}
