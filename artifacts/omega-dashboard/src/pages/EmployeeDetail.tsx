import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoute, useLocation } from 'wouter';
import { useAppContext, Employee } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft, Calendar, Phone, Mail, MapPin, Briefcase, 
  User, ShieldCheck, FileText, History, Home, DollarSign,
  MessageSquare, Pencil, ExternalLink, AlertCircle, CheckCircle2, 
  Clock, AlertTriangle, Key, Truck, UserCheck, Upload, FileCheck, Plus
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  'Active': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Offboarding': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Inactive': 'bg-red-500/20 text-red-300 border-red-500/30',
};

function StatCard({ label, value, sub, icon: Icon, cyan }: { label: string; value: string; sub?: string; icon: any; cyan?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 transition-all hover:bg-white/[0.04] ${cyan ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={cyan ? 'text-cyan-400' : 'text-muted-foreground'} />
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
      </div>
      <p className={`text-lg font-bold tracking-tight ${cyan ? 'text-cyan-400' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function TimelineNode({ ev, i }: { ev: any, i: number }) {
  const isCompleted = ev.status === 'COMPLETED';
  
  const getIcon = () => {
    if (ev.type === 'attendance') return <UserCheck size={13} className="text-emerald-400" />;
    if (ev.type === 'hired') return <CheckCircle2 size={13} className="text-cyan-400" />;
    return <Clock size={13} className="text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.05, ease: 'easeOut' }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      <div className="absolute -left-8 top-1 flex items-center justify-center">
        <div className={`w-7 h-7 rounded-full border flex items-center justify-center backdrop-blur ${
          ev.type === 'attendance' ? 'bg-emerald-500/10 border-emerald-500/30' :
          ev.type === 'hired' ? 'bg-cyan-500/20 border-cyan-500/50' :
          'bg-white/5 border-white/20'
        }`}>
          {getIcon()}
        </div>
      </div>
      <div className={`flex-1 rounded-xl border p-3 transition-colors hover:bg-white/[0.03] ${
        ev.type === 'attendance' ? 'bg-emerald-500/[0.02] border-emerald-500/5' :
        ev.type === 'hired' ? 'bg-cyan-500/5 border-cyan-500/10' :
        'bg-white/3 border-white/5'
      }`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-bold text-sm text-foreground">{ev.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ev.desc}</p>
            <p className="text-[10px] text-muted-foreground mt-2 font-mono bg-white/5 px-1.5 py-0.5 rounded-sm w-fit">{ev.date}</p>
          </div>
          <Badge className={`text-[9px] tracking-wider uppercase font-bold ${
            ev.type === 'attendance' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            ev.type === 'hired' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
            'bg-muted/50 text-muted-foreground'
          }`}>
            {ev.tag}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyTabState({ label, description, icon: Icon }: { label: string; description: string; icon: any }) {
  return (
    <div className="flex flex-col items-center justify-center border border-white/5 bg-white/[0.02] rounded-2xl p-16 text-center backdrop-blur-sm">
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground mb-4 border border-white/5">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-foreground tracking-tight mb-1">{label}</h3>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}

export default function EmployeeDetail() {
  const [, params] = useRoute('/staff/:id');
  const [, navigate] = useLocation();
  const { employees, payrollRecords, vehicles, housingUnits } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');

  // Supabase dynamic state
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [applicantRecord, setApplicantRecord] = useState<any | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingApplicant, setLoadingApplicant] = useState(false);

  const emp = employees.find(e => e.id === params?.id);

  useEffect(() => {
    if (!emp) return;

    async function fetchLiveData() {
      setLoadingLogs(true);
      setLoadingApplicant(true);
      try {
        // 1. Fetch Biometric Attendance logs where employee_id equals internalCode
        if (emp?.internalCode) {
          const { data, error } = await supabase
            .from('attendance_logs')
            .select('*')
            .eq('employee_id', emp.internalCode)
            .order('log_date', { ascending: false })
            .limit(15);
          if (!error && data) setAttendanceLogs(data);
        }

        // 2. Link Applicants by Phone or Full Name normalization
        const digits = emp?.phone ? emp.phone.replace(/\D/g, '') : '';
        const cleanDigits = digits.length >= 8 ? digits.slice(-8) : 'NO_MATCH_VECTOR';
        
        const { data: candidates, error: candErr } = await supabase
          .from('applicants')
          .select('*')
          .or(`phone.ilike.%${cleanDigits}%,full_name.ilike.%${emp?.name || 'NO_MATCH'}%`)
          .limit(1);
        
        if (!candErr && candidates && candidates.length > 0) {
          setApplicantRecord(candidates[0]);
        } else {
          setApplicantRecord(null);
        }
      } catch (err) {
        console.error("Error linking live Supabase nodes:", err);
      } finally {
        setLoadingLogs(false);
        setLoadingApplicant(false);
      }
    }

    fetchLiveData();
  }, [emp?.id]);

  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center gap-4">
        <User size={40} className="text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Personnel record not found</h2>
        <Button onClick={() => navigate('/staff')} variant="outline" className="border-white/10 hover:bg-white/5">
          <ArrowLeft size={16} className="mr-2" /> Back to Directory
        </Button>
      </div>
    );
  }

  // Compile timeline events from real seeded vector + live logs
  const timelineEvents = [];
  
  // Initial Registration Vector
  if (emp.createdAt) {
    timelineEvents.push({
      id: 'reg',
      type: 'system',
      tag: 'SYSTEM',
      title: 'System Record Enrolled',
      desc: 'Personnel metadata ingested into the Omega operational core.',
      date: emp.createdAt.split('T')[0],
      timestamp: new Date(emp.createdAt).getTime()
    });
  }

  // Official Hire Date Vector
  if (emp.hireDate) {
    timelineEvents.push({
      id: 'hire',
      type: 'hired',
      tag: 'HIRED',
      title: 'Workforce Entry Initiated',
      desc: `Activated into the operational workforce on ${emp.hireDate}.`,
      date: emp.hireDate,
      timestamp: new Date(emp.hireDate).getTime()
    });
  }

  // Live Attendance Logs Vector
  attendanceLogs.forEach(log => {
    timelineEvents.push({
      id: log.id,
      type: 'attendance',
      tag: log.type.toUpperCase(),
      title: `Biometric Shift ${log.type === 'in' ? 'Clock-In' : 'Clock-Out'}`,
      desc: `Biometric node registered activity (${log.source || 'Terminal'}). Time: ${log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}`,
      date: log.log_date,
      timestamp: new Date(log.timestamp || log.log_date).getTime()
    });
  });

  // Sort chronological descending
  timelineEvents.sort((a, b) => b.timestamp - a.timestamp);

  // Context Linked Arrays
  const linkedPayroll = payrollRecords.filter(p => 
    (emp.internalCode && p.internalCode === emp.internalCode) || 
    p.employeeName?.toLowerCase().includes(emp.name.toLowerCase())
  );

  const linkedHousing = housingUnits.find(u => 
    u.id === emp.housingUnitId || 
    u.residents?.some(r => r.code === emp.internalCode || r.name.toLowerCase().includes(emp.name.toLowerCase()))
  );

  const linkedVehicle = vehicles.find(v => 
    v.id === emp.assignedVehicleId || 
    v.driverCode === emp.internalCode || 
    v.driver?.toLowerCase().includes(emp.name.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0][0] || 'EE';
  };

  // Compliance Calculators
  const complianceAlerts = [];
  if (!emp.phone) complianceAlerts.push({ type: 'warning', msg: 'Contact Channel Missing: No active phone loaded.' });
  if (!emp.currentSite) complianceAlerts.push({ type: 'warning', msg: 'Unallocated Workforce Vector: No project deployment assigned.' });
  if (emp.insuranceStatus !== 'Valid') complianceAlerts.push({ type: 'critical', msg: `Compliance Void: Insurance status is ${emp.insuranceStatus}.` });
  
  const checkPassportStatus = () => {
    if (!emp.passportExpiry) return 'Missing';
    const exp = new Date(emp.passportExpiry);
    const now = new Date();
    const diff = exp.getTime() - now.getTime();
    if (diff < 0) return 'Expired';
    if (diff < 1000 * 60 * 60 * 24 * 30 * 3) return 'Expiring Soon'; // 3 months
    return 'Valid';
  };
  const passportStatus = checkPassportStatus();
  if (passportStatus !== 'Valid') complianceAlerts.push({ type: passportStatus === 'Expired' ? 'critical' : 'warning', msg: `Travel Document Check: Passport is ${passportStatus}.` });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-0 -mt-2"
    >
      {/* Header Layout Panel */}
      <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-[#0F1319] via-[#0A0B0E] to-[#0D0E12] border border-white/5">
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, hsl(190 90% 50% / 0.2) 0%, transparent 60%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="relative px-6 pt-5 pb-6">
          {/* Navigation Bar */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <button
              onClick={() => navigate('/staff')}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-xs tracking-wide uppercase font-bold group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-cyan-500" />
              Directory
            </button>
            <div className="flex items-center gap-2">
              <Badge className={`${statusColors[emp.status]} uppercase tracking-wider text-[10px] font-black`}>
                {emp.status}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/5 gap-1.5 h-8 text-xs"
                onClick={() => {}} 
              >
                <Pencil size={13} /> Edit Record
              </Button>
            </div>
          </div>

          {/* Profile Metadata Anchor */}
          <div className="flex items-center gap-5 mb-6 flex-wrap sm:flex-nowrap">
            <div className="h-16 w-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg backdrop-blur-md shrink-0">
              <span className="text-cyan-400 font-black text-xl tracking-widest">{getInitials(emp.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-foreground tracking-tight leading-none" dir="rtl">{emp.name}</h1>
                <Badge variant="outline" className="font-mono text-cyan-400 bg-cyan-500/5 border-cyan-500/20 text-xs h-5 px-2">
                  {emp.internalCode || '—'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mt-2.5">
                <span className="flex items-center gap-1.5"><Briefcase size={13} className="text-cyan-500/70" /> {emp.role}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <span className="flex items-center gap-1.5"><User size={13} className="text-cyan-500/70" /> {emp.department}</span>
              </div>
            </div>

            {/* Operational Fast-Response Links */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {emp.phone && (
                <>
                  <a href={`tel:${emp.phone}`} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/50 text-muted-foreground hover:text-cyan-400 transition-all shadow-sm">
                    <Phone size={16} />
                  </a>
                  <a href={`https://wa.me/${emp.phone.replace(/\+/g, '')}`} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-emerald-500/50 text-muted-foreground hover:text-emerald-400 transition-all shadow-sm">
                    <MessageSquare size={16} />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Standard High-Density Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <StatCard label="Workforce Role" value={emp.role} sub={emp.department} icon={Briefcase} cyan />
            <StatCard label="Site Allocation" value={emp.currentSite || '—'} icon={MapPin} />
            <StatCard label="Vetting & Compliance" value={emp.insuranceStatus || 'Not Verified'} sub={emp.passportExpiry ? `Passport Expiry: ${emp.passportExpiry}` : 'Passport Pending'} icon={ShieldCheck} />
            <StatCard label="Lifecycle Entry" value={emp.hireDate ? formatDate(emp.hireDate) : '—'} sub="Joined Operations" icon={Calendar} />
          </div>
        </div>
      </div>

      {/* Multi-Grid Tab Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="bg-[#0D0E12] border border-white/5 p-1 h-11 gap-1 w-full justify-start overflow-x-auto flex-nowrap no-scrollbar">
          <TabsTrigger value="overview" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <User size={13} /> Overview
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <History size={13} /> Operational Timeline
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <ShieldCheck size={13} /> HR & Compliance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <DollarSign size={13} /> Payroll
          </TabsTrigger>
          <TabsTrigger value="housing" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <Home size={13} /> Housing & Fleet
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <ExternalLink size={13} /> Recruitment History
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 text-xs px-4 data-[state=active]:bg-cyan-500/10 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/20">
            <FileText size={13} /> Documents
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Panel */}
            <TabsContent value="overview" forceMount className={activeTab !== 'overview' ? 'hidden' : 'grid gap-4 md:grid-cols-2'}>
              <Card className="bg-white/5 border-white/10 h-fit">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><User size={14} className="text-cyan-400" /> Personal Identity</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs py-2 border-b border-white/5"><span className="text-muted-foreground">Full Name</span><span className="font-bold text-right" dir="rtl">{emp.name}</span></div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5"><span className="text-muted-foreground">Internal System Code</span><span className="font-mono text-cyan-400">{emp.internalCode || '—'}</span></div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5"><span className="text-muted-foreground">Assigned Department</span><span>{emp.department}</span></div>
                  <div className="flex justify-between text-xs py-2"><span className="text-muted-foreground">Role Status</span><span>{emp.role}</span></div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 h-fit">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Phone size={14} className="text-cyan-400" /> Telemetry & Contact</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs py-2 border-b border-white/5"><span className="text-muted-foreground">Phone Channel</span><span className="font-mono text-cyan-400">{emp.phone || '—'}</span></div>
                  <div className="flex justify-between text-xs py-2 border-b border-white/5"><span className="text-muted-foreground">Email Address</span><span className="text-right text-muted-foreground">{emp.email || '—'}</span></div>
                  <div className="flex justify-between text-xs py-2"><span className="text-muted-foreground">Preferred Messenger</span><span className="text-emerald-400">WhatsApp Active</span></div>
                </CardContent>
              </Card>

              {(linkedHousing || linkedVehicle) && (
                <Card className="bg-white/5 border-white/10 md:col-span-2">
                  <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Key size={14} className="text-cyan-400" /> Linked Operational Assets</CardTitle></CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    {linkedHousing && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300"><Home size={16} /></div>
                        <div><p className="text-xs font-bold">Unit {linkedHousing.unitNumber}</p><p className="text-[10px] text-muted-foreground">{linkedHousing.location}</p></div>
                      </div>
                    )}
                    {linkedVehicle && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"><Truck size={16} /></div>
                        <div><p className="text-xs font-bold">{linkedVehicle.carName}</p><p className="text-[10px] text-muted-foreground">Plate: {linkedVehicle.plateNumber} • Status: {linkedVehicle.status}</p></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Timeline Panel */}
            <TabsContent value="timeline" forceMount className={activeTab !== 'timeline' ? 'hidden' : ''}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3 flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold flex items-center gap-2"><History size={14} className="text-cyan-400" /> Personnel Operations Audit Trail</CardTitle>{loadingLogs && <span className="text-[10px] text-muted-foreground animate-pulse">Polling Supabase...</span>}</CardHeader>
                <CardContent className="pt-4">
                  {timelineEvents.length > 0 ? (
                    <div className="relative pl-8">
                      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/10" />
                      <div className="space-y-0">
                        {timelineEvents.map((ev, i) => (
                          <TimelineNode key={ev.id} ev={ev} i={i} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyTabState label="No Audit Vector" description="Operational and access logs are clean for this period." icon={History} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Compliance Panel */}
            <TabsContent value="compliance" forceMount className={activeTab !== 'compliance' ? 'hidden' : 'space-y-4'}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><ShieldCheck size={14} className="text-cyan-400" /> Legal & Operational Credentials</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center justify-between">
                      Passport / ID
                      <Badge variant="outline" className={`text-[9px] ${
                        passportStatus === 'Valid' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                        passportStatus === 'Expiring Soon' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5' :
                        'text-red-400 border-red-500/20 bg-red-500/5'
                      }`}>
                        {passportStatus}
                      </Badge>
                    </p>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Expiration Status:</span><span className="font-mono text-foreground font-bold">{emp.passportExpiry || 'Not Recorded'}</span></div>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-2 flex items-center justify-between">
                      Insurance Coverage
                      <Badge variant="outline" className={`text-[9px] ${
                        emp.insuranceStatus === 'Valid' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' :
                        'text-red-400 border-red-500/20 bg-red-500/5'
                      }`}>
                        {emp.insuranceStatus}
                      </Badge>
                    </p>
                    <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Active Certificate:</span><span className="font-mono text-foreground font-bold">{emp.insuranceStatus}</span></div>
                  </div>
                </CardContent>
              </Card>

              {complianceAlerts.length > 0 && (
                <Card className="bg-white/5 border border-white/10 border-l-4 border-l-amber-500/60">
                  <CardHeader className="pb-2"><CardTitle className="text-xs font-bold flex items-center gap-2 text-amber-400"><AlertTriangle size={14} /> Active Compliance Vectors</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {complianceAlerts.map((a, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs py-1 bg-white/[0.02] px-2.5 rounded-lg border border-white/5">
                        <span className={`w-1.5 h-1.5 rounded-full ${a.type === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        <span className="text-muted-foreground">{a.msg}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payroll Panel */}
            <TabsContent value="payroll" forceMount className={activeTab !== 'payroll' ? 'hidden' : 'space-y-4'}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><DollarSign size={14} className="text-cyan-400" /> Compensation Profiles</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Basic Base Compensation</p>
                    <p className="text-xl font-black tracking-tight mt-1 font-mono">EGP {Number(emp.basicSalary || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Site Allowance</p>
                    <p className="text-xl font-black tracking-tight mt-1 font-mono">EGP {Number(emp.siteAllowance || 0).toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-cyan-500/5 border border-cyan-500/20 p-4 shadow-md shadow-cyan-500/5">
                    <p className="text-[10px] text-cyan-400 uppercase font-bold">Est. Combined Comp</p>
                    <p className="text-xl font-black tracking-tight mt-1 font-mono text-cyan-300">EGP {(Number(emp.basicSalary || 0) + Number(emp.siteAllowance || 0)).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><History size={14} className="text-cyan-400" /> Historical Payroll Archives</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {linkedPayroll.length > 0 ? (
                    linkedPayroll.map((rec) => (
                      <div key={rec.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5 hover:border-white/10 transition-all gap-2">
                        <div>
                          <p className="text-xs font-bold">{rec.month}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Site: {rec.siteName || 'Main Station'} • Code: {rec.internalCode}</p>
                        </div>
                        <div className="flex items-center gap-4 font-mono">
                          <div className="text-right">
                            <p className="text-xs font-bold">EGP {rec.netSalary?.toLocaleString()}</p>
                            <p className="text-[9px] text-muted-foreground">Net Distributed</p>
                          </div>
                          <Badge className={`text-[9px] font-black uppercase ${
                            rec.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            rec.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {rec.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-xs text-muted-foreground">
                      No active historical disbursements registered in context archive.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Housing & Fleet Panel */}
            <TabsContent value="housing" forceMount className={activeTab !== 'housing' ? 'hidden' : 'grid gap-4 md:grid-cols-2'}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Home size={14} className="text-cyan-400" /> Housing & Accommodation</CardTitle></CardHeader>
                <CardContent>
                  {linkedHousing ? (
                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div><p className="text-xs font-bold">Unit Number</p><p className="text-lg font-black font-mono text-indigo-300">{linkedHousing.unitNumber}</p></div>
                        <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 uppercase text-[9px]">{linkedHousing.status}</Badge>
                      </div>
                      <div className="text-xs border-t border-white/5 pt-2 space-y-1.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{linkedHousing.location}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Occupancy Vector</span><span>{linkedHousing.occupants} / {linkedHousing.capacity}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-xl">No active corporate housing assignment located.</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-bold flex items-center gap-2"><Truck size={14} className="text-cyan-400" /> Vehicle Allocation</CardTitle></CardHeader>
                <CardContent>
                  {linkedVehicle ? (
                    <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div><p className="text-xs font-bold">Assigned Vehicle</p><p className="text-base font-black text-cyan-300">{linkedVehicle.carName}</p></div>
                        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-300 uppercase text-[9px]">{linkedVehicle.status}</Badge>
                      </div>
                      <div className="text-xs border-t border-white/5 pt-2 space-y-1.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">Plate Registry</span><span className="font-mono font-bold">{linkedVehicle.plateNumber}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Fuel Card Matrix</span><span className="font-mono text-emerald-400">EGP {linkedVehicle.fuelCardBalance?.toLocaleString()}</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-white/10 rounded-xl">No vehicle or driver profile linked to this code.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recruitment History Panel */}
            <TabsContent value="recruitment" forceMount className={activeTab !== 'recruitment' ? 'hidden' : ''}>
              {loadingApplicant ? (
                <div className="py-20 text-center text-xs text-muted-foreground animate-pulse flex flex-col items-center gap-2"><Clock size={18} className="text-cyan-400 animate-spin" /> Fetching Recruitment Dossier...</div>
              ) : applicantRecord ? (
                <Card className="bg-white/5 border-white/10 overflow-hidden relative">
                  <div className="absolute inset-0 opacity-5 bg-gradient-to-b from-cyan-500 to-transparent pointer-events-none" />
                  <CardHeader className="pb-3 border-b border-white/5 flex flex-row justify-between items-start gap-4">
                    <div>
                      <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 uppercase text-[9px] tracking-widest font-black mb-1">SALLY APPLICANT DOCKET</Badge>
                      <CardTitle className="text-lg font-black tracking-tight text-foreground">{applicantRecord.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{applicantRecord.job_title} • Score: <span className="text-cyan-400 font-bold font-mono">{applicantRecord.score || '—'}</span></p>
                    </div>
                    <Badge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 uppercase text-[10px]">{applicantRecord.status}</Badge>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Executive Intake Summary</p>
                      <p className="text-xs leading-relaxed text-muted-foreground bg-white/[0.02] p-3 rounded-xl border border-white/5">{applicantRecord.summary || "Applicant data indexed natively without screening summary details."}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 text-xs">
                      <div className="flex justify-between p-2 border-b border-white/5"><span className="text-muted-foreground">Registry Date</span><span className="font-mono">{applicantRecord.created_at ? applicantRecord.created_at.split('T')[0] : '—'}</span></div>
                      <div className="flex justify-between p-2 border-b border-white/5"><span className="text-muted-foreground">Intake Vector</span><span>{applicantRecord.email || 'Electronic Intake'}</span></div>
                    </div>
                    {applicantRecord.cv_url && (
                      <Button 
                        asChild 
                        variant="outline" 
                        className="w-full sm:w-auto h-9 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/5 hover:border-cyan-500/40 gap-2"
                      >
                        <a href={applicantRecord.cv_url} target="_blank" rel="noreferrer">
                          <FileText size={14} />
                          Inspect Submitted CV Scanner
                          <ExternalLink size={12} />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <EmptyTabState label="No Recruitment Ledger" description="No matching candidate archives or interview notes were found in Sally Recruitment matching this name/phone." icon={ExternalLink} />
              )}
            </TabsContent>

            {/* Documents Panel */}
            <TabsContent value="documents" forceMount className={activeTab !== 'documents' ? 'hidden' : 'grid gap-4 sm:grid-cols-2 md:grid-cols-3'}>
              {[
                { title: 'Curriculum Vitae', key: 'cv', required: true, desc: 'Initial recruitment profiling document.' },
                { title: 'Passport / ID Scan', key: 'passport', required: true, desc: 'Vetted national identity credentials.' },
                { title: 'Active Employment Contract', key: 'contract', required: true, desc: 'Signed operations onboarding protocol.' },
                { title: 'National Health Certificate', key: 'insurance', required: false, desc: 'Active healthcare/insurance card scan.' },
                { title: 'Equipment Handover Protocol', key: 'handover', required: false, desc: 'Custody and asset allocation logs.' },
              ].map((docType, idx) => (
                <div key={idx} className="p-4 border border-white/5 bg-white/[0.02] hover:bg-white/[0.03] hover:border-white/10 transition-all rounded-2xl group relative flex flex-col h-36 justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground"><FileCheck size={14} /></span>
                      {docType.required && <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-red-500/20 text-red-400">REQ</Badge>}
                    </div>
                    <p className="text-xs font-bold text-foreground mt-2 line-clamp-1">{docType.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">{docType.desc}</p>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 font-mono pt-2 border-t border-white/5">
                    <span>EMPTY SLOT</span>
                    <button className="text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1 transition-colors opacity-60 group-hover:opacity-100">
                      <Upload size={10} /> Upload
                    </button>
                  </div>
                </div>
              ))}
              <div className="p-4 border border-dashed border-white/10 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all rounded-2xl group flex flex-col items-center justify-center text-center h-36 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-cyan-400 mb-2"><Plus size={14} /></div>
                <p className="text-xs font-bold text-muted-foreground group-hover:text-cyan-300">Ingest New Node</p>
                <p className="text-[9px] text-muted-foreground/40">Support PDF, JPG, PNG</p>
              </div>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
