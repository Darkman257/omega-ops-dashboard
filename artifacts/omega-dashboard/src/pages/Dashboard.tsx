import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  BrainCircuit, 
  Zap,
  Flame,
  Activity,
  AlertTriangle,
  Eye,
  Layers,
  Database,
  Cpu,
  Fingerprint,
  Radio,
  Network,
  TrendingDown,
  Users,
  Target,
  Truck,
  Bell,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  XAxis, 
  YAxis, 
  Tooltip as ReTooltip,
  Cell
} from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { calculateLivingSystem, NeuralNode, LivingSystemData } from '@/lib/financials';
import { WeatherRiskWidget } from '@/reference-patterns/omega/WeatherRiskWidget';
import { RealtimeOpsFeed } from '@/reference-patterns/omega/RealtimeOpsFeed';
import { OperationalKpiCard } from '@/reference-patterns/omega/OperationalKpiCard';
import ContractsFlow from '@/components/ContractsFlow';
import SystemStabilityBar from '@/components/SystemStabilityBar';
import OpsSignalPanel from '@/components/OpsSignalPanel';
import NeuralReasoningCard from '@/components/NeuralReasoningCard';
import NeuralMapPanel from '@/components/NeuralMapPanel';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Dashboard() {
  const { projects, payrollRecords, employees, vehicles, documents } = useAppContext();
  const [mode, setMode] = useState<'OWNER' | 'OPS' | 'AI' | 'CONTRACTS'>('OWNER');

  const living = useMemo(() => calculateLivingSystem(projects, payrollRecords, employees), [projects, payrollRecords, employees]);

  const totalEmployees = (employees || []).length;
  const activeEmployees = (employees || []).filter(e => e.status === 'Active').length || 0;
  const activeVehicles = (vehicles || []).filter(v => v.status === 'Active' || v.status === 'In Service').length || 0;
  const pendingApprovals = (documents || []).filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length || 0;
  const cashBurnToday = (payrollRecords || []).reduce((sum, r) => sum + (r.netSalary || 0), 0) / 30;

  const proactiveAlerts = useMemo(() => {
    const alerts: { id: string; label: string; severity: 'NORMAL' | 'WARNING' | 'CRITICAL'; time: string }[] = [];
    const laborRate = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;
    const inactiveVehicleRate = vehicles.length > 0 ? ((vehicles.length - activeVehicles) / vehicles.length) * 100 : 0;

    if (laborRate < 70) {
      alerts.push({ id: 'labor', label: `Low labor participation: ${laborRate.toFixed(1)}%`, severity: 'WARNING', time: 'Just now' });
    }
    if (inactiveVehicleRate > 30) {
      alerts.push({ id: 'fleet', label: `Fleet inactivity exceeds 30% (${inactiveVehicleRate.toFixed(1)}%)`, severity: 'WARNING', time: 'Just now' });
    }
    if (pendingApprovals > 0) {
      alerts.push({ id: 'approvals', label: `${pendingApprovals} unresolved alerts or expirations detected`, severity: 'CRITICAL', time: 'Just now' });
    }
    if (cashBurnToday > 15000) {
      alerts.push({ id: 'finance', label: `Financial: Burn rate high (${Math.round(cashBurnToday).toLocaleString()} EGP)`, severity: 'WARNING', time: 'Just now' });
    }

    return alerts;
  }, [totalEmployees, activeEmployees, vehicles.length, activeVehicles, pendingApprovals, cashBurnToday]);

  const overallSeverity = useMemo(() => {
    if (proactiveAlerts.some(a => a.severity === 'CRITICAL')) return 'CRITICAL';
    if (proactiveAlerts.some(a => a.severity === 'WARNING')) return 'WARNING';
    return 'NORMAL';
  }, [proactiveAlerts]);

  const coreColor = living.verdict.state === 'BLEEDING' ? 'text-red-500 shadow-[0_0_80px_rgba(239,68,68,0.6)]' : 
                   living.verdict.state === 'WARNING' ? 'text-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.4)]' : 
                   'text-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.4)]';

  const coreBorder = living.verdict.state === 'BLEEDING' ? 'border-red-500/50' : 
                    living.verdict.state === 'WARNING' ? 'border-amber-500/50' : 
                    'border-emerald-500/50';

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12 relative overflow-hidden min-h-screen"
    >
      {/* 1. BACKGROUND GRID & PARTICLES */}
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none z-[-1]" />
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
      </div>

      {/* 2. MODE SWITCHER (CYBER HUD) */}
      {/* ContractsFlow is isolated. Intended for AL-Sebaei Asset Hub migration, not Omega production scope. */}
      <div className="flex justify-center mb-8">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-full flex gap-1">
          {(['OWNER', 'OPS', 'AI'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all ${
                mode === m ? 'bg-primary text-black shadow-[0_0_15px_rgba(201,168,76,0.5)]' : 'text-white/40 hover:text-white'
              }`}
            >
              {m} MODE
            </button>
          ))}
        </div>
      </div>

      {/* TOP CONTROL STRIP (PERSONAL CONTROL MODE) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-1 max-w-7xl mx-auto select-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all duration-300">
          <div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Users size={12} className="text-emerald-400" /> Workers On Duty
            </div>
            <div className="text-2xl font-black text-foreground">{activeEmployees} / {totalEmployees}</div>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-white/5 border border-white/5 px-2 py-1 rounded-lg">Real</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all duration-300">
          <div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Truck size={12} className="text-primary" /> Active Equipment
            </div>
            <div className="text-2xl font-black text-foreground">{activeVehicles} units</div>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-white/5 border border-white/5 px-2 py-1 rounded-lg">Real</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all duration-300">
          <div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <Bell size={12} className="text-amber-400 animate-pulse" /> Active Alerts
            </div>
            <div className="text-2xl font-black text-foreground">{pendingApprovals} alerts</div>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-white/5 border border-white/5 px-2 py-1 rounded-lg">Real</div>
        </div>

        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-center justify-between hover:border-primary/40 transition-all duration-300">
          <div>
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-1">
              <DollarSign size={12} className="text-red-400" /> Cash Burn Today
            </div>
            <div className="text-2xl font-black text-foreground">{Math.round(cashBurnToday).toLocaleString()} EGP</div>
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-white/5 border border-white/5 px-2 py-1 rounded-lg">Real</div>
        </div>
      </div>

      {/* PROACTIVE ALERT ENGINE FEED */}
      {proactiveAlerts.length > 0 && (
        <div className="max-w-7xl mx-auto px-1">
          <div className={`p-4 bg-[#0A0A0A]/90 backdrop-blur-md border rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 select-none animate-pulse ${
            overallSeverity === 'CRITICAL' ? 'border-red-500/40 hover:border-red-500' : 'border-amber-500/40 hover:border-amber-500'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-ping ${
                overallSeverity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              <div>
                <div className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert size={14} className={overallSeverity === 'CRITICAL' ? 'text-red-500 animate-bounce' : 'text-amber-500'} />
                  Proactive Alert Directives
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Automated signal monitoring tracks labor, fleet, finance, and expirations.</div>
              </div>
            </div>

            {/* Compact feed items */}
            <div className="flex flex-wrap items-center gap-2">
              {proactiveAlerts.map((alert) => (
                <div key={alert.id} className={`px-2.5 py-1 bg-white/5 border rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all hover:bg-white/10 ${
                  alert.severity === 'CRITICAL' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  {alert.label} <span className="opacity-40 text-[8px] font-black tracking-widest">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'CONTRACTS' ? (
        <ContractsFlow />
      ) : (
        <>
          {/* 1. OMEGA WAR ROOM LAYER (NOW TOP) */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="text-primary" size={24} />
              <h2 className="text-2xl font-black tracking-widest uppercase text-foreground neon-text-gold">
                Omega War Room Layer
              </h2>
            </div>
            
            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <OperationalKpiCard 
                title="Active Machinery" 
                value={living.summary.activeSites * 12 || 142} 
                unit="Units" 
                trend={12.5} 
                color="cyan" 
              />
              <OperationalKpiCard 
                title="Workforce Presence" 
                value={living.summary.workforce.present || 854} 
                unit="Staff" 
                trend={-2.1} 
                color="emerald" 
              />
              <OperationalKpiCard 
                title="Critical Delays" 
                value={living.summary.criticalRisks || 3} 
                unit="Alerts" 
                trend={15.0} 
                color="amber" 
              />
            </div>

            {/* Bottom Row: Weather & Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4 h-full">
                <WeatherRiskWidget 
                  siteName="NEOM Sector 4"
                  temperature={42}
                  condition="Sandstorm Warning"
                  riskLevel="Critical"
                  activeAlerts={["Crane Operations Suspended", "Visibility < 50m"]}
                />
              </div>
              <div className="lg:col-span-8 h-full">
                <RealtimeOpsFeed title="Live Operations Stream (Auto-Sync)" />
              </div>
            </div>
          </div>

          {/* 2. BOTTOM COMMAND STRIPS (REACTIVE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Lost Today', value: living.summary.lostToday, sub: 'Leak Estimate', icon: TrendingDown, color: '#EF4444', spark: [300, 500, 400, 700, 600, 1000] },
              { label: 'Workforce', value: living.summary.workforce.present, sub: 'Active Now', icon: Users, color: '#C9A84C', spark: [10, 15, 12, 18, 17, 20] },
              { label: 'Active Sites', value: living.summary.activeSites, sub: 'Running Now', icon: Target, color: '#10B981', spark: [2, 3, 3, 4, 4, 5] },
              { label: 'Critical Risks', value: living.summary.criticalRisks, sub: 'Action Required', icon: ShieldAlert, color: '#F59E0B', spark: [0, 1, 2, 1, 2, 3] }
            ].map((stat, i) => (
              <motion.div key={i} variants={container} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group hover:border-primary/50 transition-all">
                <div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-xl font-black">{stat.value}</div>
                </div>
                <stat.icon className={`${stat.color} group-hover:scale-125 transition-transform`} size={20} />
              </motion.div>
            ))}
          </div>

          {/* 3. OPS INTELLIGENCE SIGNAL SECTION (NOW BELOW) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch border-t border-white/10 pt-6 mt-6 mb-6">
            {/* Left Column: Core Signal Monitoring */}
            <div className="lg:col-span-5 h-full min-h-[220px]">
              <OpsSignalPanel 
                verdict={living.verdict}
                stabilityValue={living.verdict.state === 'BLEEDING' ? 35 : living.verdict.state === 'WARNING' ? 65 : 96}
              />
            </div>

            {/* Right Column: Reasoning and SVG Neural Map */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-4 h-full min-h-[220px]">
              <NeuralReasoningCard 
                what={`${activeEmployees} of ${totalEmployees} workers on duty. ${activeVehicles} active units available. ${pendingApprovals} active alerts logged.`}
                why={totalEmployees > 0 && (activeEmployees / totalEmployees) < 0.6 
                  ? `Labor participation rate of ${((activeEmployees / totalEmployees) * 100).toFixed(1)}% is critical. This impacts project SLAs and deadlines directly.` 
                  : pendingApprovals > 2 
                  ? `Attention required: ${pendingApprovals} pending alerts/expirations need review to avoid compliance holds.` 
                  : `Operational health is optimal with ${totalEmployees > 0 ? ((activeEmployees / totalEmployees) * 100).toFixed(1) : 100}% workforce present.`
                }
                impact={`Cash burn is ${Math.round(cashBurnToday).toLocaleString()} EGP today. Action directly affects cash flow and operational risk.`}
                actionsNow={['Deploy Staff', 'Resolve Alerts', 'Manage Fleet']}
                severity={overallSeverity}
              />
              <div className="flex-1 min-h-[300px]">
                <NeuralMapPanel nodes={living.neural.nodes} />
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
