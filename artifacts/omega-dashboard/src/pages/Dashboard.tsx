import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  BrainCircuit, 
  TrendingDown, 
  Users, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Timer,
  Eye,
  Radar,
  Wallet,
  Zap,
  Flame,
  ArrowUpRight,
  UserX
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { getGlobalFinancials, getImpactData, WorkerRisk } from '@/lib/financials';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const { projects, payrollRecords: payroll, employees } = useAppContext();

  const financials = useMemo(() => getGlobalFinancials(projects, payroll, employees), [projects, payroll, employees]);
  const impact = useMemo(() => getImpactData(projects, payroll, employees), [projects, payroll, employees]);

  const stateColor = impact.systemState === 'BLEEDING' ? 'bg-red-600' : 
                    impact.systemState === 'WARNING' ? 'bg-amber-600' : 'bg-emerald-600';

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* SECTION 1: IMPACT HEADER */}
      <motion.div variants={item} className={`p-8 rounded-3xl relative overflow-hidden transition-all duration-700 ${stateColor}`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 animate-pulse" />
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-center text-white">
          <div>
            <div className="text-white/60 text-xs font-black uppercase tracking-[0.2em] mb-2">Lost Today (Estimated)</div>
            <div className="text-6xl font-black tracking-tighter flex items-center gap-4">
              {impact.lostToday.toLocaleString()} <span className="text-2xl font-medium opacity-50">EGP</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">System State</div>
            <div className="text-4xl font-black tracking-tighter flex items-center gap-3">
              {impact.systemState === 'BLEEDING' && <Flame className="animate-bounce" />}
              {impact.systemState}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">System Health</div>
            <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${impact.healthScore}%` }}
                className="h-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
              />
            </div>
            <div className="text-right font-black">{impact.healthScore}% OPERATIONAL</div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ACTION PANEL */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10 overflow-hidden relative glass-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BrainCircuit className="text-primary" size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Action Recommendations</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {impact.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <Zap size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground leading-snug">{rec}</p>
                      <span className="text-[10px] text-primary uppercase font-black tracking-widest mt-1 block">Execute Now</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* WORKER RISK PANEL */}
        <motion.div variants={item}>
          <Card className="bg-white/5 border-white/10 glass-card h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <UserX className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Worker Risk Index</h2>
              </div>
              
              <div className="space-y-4">
                {impact.workerRisks.length > 0 ? impact.workerRisks.map((w: WorkerRisk) => (
                  <div key={w.internalCode} className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-bold text-sm">{w.name} <span className="text-[10px] text-muted-foreground ml-1">#{w.internalCode}</span></div>
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">Risk: {w.riskScore}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-black/20 rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase">Lates</div>
                        <div className="text-sm font-black">{w.lateCount}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase">OT (H)</div>
                        <div className="text-sm font-black">{w.overtimeHours.toFixed(0)}</div>
                      </div>
                      <div className="p-2 bg-black/20 rounded-lg">
                        <div className="text-[10px] text-muted-foreground uppercase">Atten.</div>
                        <div className={`text-[10px] font-black ${w.isMissingAttendance ? 'text-red-500' : 'text-emerald-500'}`}>
                          {w.isMissingAttendance ? 'MISSING' : 'OK'}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-muted-foreground text-sm italic">No workforce anomalies today.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 2: COST REALITY & LIVE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COST REALITY */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10 glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Wallet className="text-primary" size={24} />
                  <h2 className="text-xl font-bold text-foreground">Site Burn Analysis</h2>
                </div>
              </div>

              <div className="space-y-6">
                {financials.allProjectFinancials.slice(0, 3).map(f => (
                  <div key={f.projectId} className="group cursor-pointer">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <div className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{f.projectName}</div>
                        <div className="text-xs text-muted-foreground">Contract: {f.contractValue.toLocaleString()} EGP</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-black ${f.grossRemaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {f.totalPayrollCost.toLocaleString()} EGP
                        </div>
                        <div className="text-xs text-muted-foreground font-bold">BURN: {f.payrollBurnRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, f.payrollBurnRate)}%` }}
                        className={`h-full rounded-full ${
                          f.payrollBurnRate > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                          f.payrollBurnRate > 70 ? 'bg-amber-500' : 'bg-primary shadow-[0_0_10px_rgba(201,168,76,0.5)]'
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ANIMATED LIVE FEED */}
        <motion.div variants={item}>
          <Card className="bg-[#0B1120] border-white/10 h-full overflow-hidden relative">
            <div className="scanline" />
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest">Live Control Room</span>
                </div>
              </div>
              <div className="flex-1 bg-black/40 p-4 font-mono text-[10px] text-primary/80 overflow-y-auto max-h-[300px]">
                <div className="space-y-3">
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-emerald-500">[15:01] SECURE LINK ESTABLISHED</motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>[15:02] ATTENDANCE: ID-402 CHECK-IN (STEFANO P1)</motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="text-amber-500">[15:05] ALERT: ID-112 HIGH OVERTIME DETECTED</motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}>[15:10] LOG: PAYROLL BATCH "JUNE-A" PENDING REVIEW</motion.div>
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.0 }} className="text-red-500">[15:15] CRITICAL: SITE "EL ASIMA" BURN RATE {'>'} 95%</motion.div>
                  <div className="animate-pulse">_</div>
                </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">On Site</div>
                    <div className="text-2xl font-black">18</div>
                  </div>
                  <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Risks</div>
                    <div className="text-2xl font-black text-red-500">{impact.workerRisks.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 3: TOP RISK PROJECTS */}
      <motion.div variants={item}>
        <Card className="bg-white/5 border-white/10 glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-8">
              <TrendingDown className="text-red-500" size={24} />
              <h2 className="text-xl font-bold text-foreground">Top Risk Projects</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {financials.allProjectFinancials
                .sort((a, b) => b.payrollBurnRate - a.payrollBurnRate)
                .slice(0, 3)
                .map((f, idx) => (
                  <div key={f.projectId} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 group">
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black italic ${idx === 0 ? 'text-red-500' : 'text-muted-foreground/30'}`}>#{idx + 1}</span>
                      <div>
                        <div className="text-sm font-black text-foreground uppercase tracking-tight">{f.projectName}</div>
                        <div className={`text-[10px] uppercase font-black tracking-[0.2em] ${
                          f.riskLevel === 'HIGH_RISK' ? 'text-red-500' : 
                          f.riskLevel === 'MEDIUM_RISK' ? 'text-amber-500' : 'text-emerald-500'
                        }`}>
                          {f.riskLevel.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-foreground tracking-tighter">{f.payrollBurnRate.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Burn</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
