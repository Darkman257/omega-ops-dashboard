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
  ArrowUpRight, 
  Timer,
  Eye,
  Radar,
  Wallet,
  Zap
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { getGlobalFinancials, getDecisionEngineData, PayrollLeak } from '@/lib/financials';

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
  const decision = useMemo(() => getDecisionEngineData(projects, payroll, employees), [projects, payroll, employees]);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* SECTION 1: TOP RADAR & VERDICT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEAK RADAR */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="bg-white/5 backdrop-blur-md border-white/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Radar size={120} className="text-primary animate-pulse" />
            </div>
            <CardContent className="p-6 relative overflow-hidden">
              <div className="scanline" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <ShieldAlert className="text-red-500" size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Leak Radar <span className="text-xs font-normal text-muted-foreground ml-2">Live Alerts</span></h2>
              </div>
              
              <div className="space-y-3">
                {financials.leaks.length > 0 ? (
                  financials.leaks.slice(0, 3).map((leak: PayrollLeak) => (
                    <div key={leak.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-red-500/30 transition-all group/leak">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${leak.severity === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground group-hover/leak:text-red-400 transition-colors">{leak.description}</p>
                        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Source: {leak.type.replace('_', ' ')}</p>
                      </div>
                      <AlertCircle size={16} className="text-muted-foreground opacity-0 group-hover/leak:opacity-100 transition-opacity" />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 size={40} className="text-emerald-500 mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm italic">No leaks detected in the last 24 hours.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* DAILY VERDICT */}
        <motion.div variants={item}>
          <Card className={`h-full border-white/10 overflow-hidden relative ${
            decision.verdict === 'CRITICAL' ? 'bg-gradient-to-br from-red-500/20 to-transparent' : 
            decision.verdict === 'WARNING' ? 'bg-gradient-to-br from-amber-500/20 to-transparent' : 
            'bg-gradient-to-br from-emerald-500/20 to-transparent'
          }`}>
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-6">
                <BrainCircuit className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-foreground">Smart Verdict</h2>
              </div>
              
              <div className="flex-1 flex flex-col justify-center text-center">
                <div className={`text-4xl font-black mb-4 uppercase tracking-tighter ${
                  decision.verdict === 'CRITICAL' ? 'text-red-500' : 
                  decision.verdict === 'WARNING' ? 'text-amber-500' : 
                  'text-emerald-500'
                }`}>
                  {decision.verdict}
                </div>
                <p className="text-foreground font-medium leading-relaxed mb-6">
                  "{decision.reason}"
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/5 text-xs text-muted-foreground">
                <Zap size={14} className="inline mr-2 text-primary" />
                AI Suggestion: Consider auditing Site "{financials.highestCostSite}" to optimize overtime distribution.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 2: CORE METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Attendance Rate', value: `${decision.attendanceRate.toFixed(1)}%`, sub: '18 / 25 Present', icon: Timer, color: 'text-primary' },
          { label: 'Productivity', value: `${decision.productivityScore.toFixed(1)}%`, sub: '+3% vs last week', icon: Activity, color: 'text-emerald-500' },
          { label: 'Active Leaks', value: decision.leakTotal, sub: 'Requires Review', icon: ShieldAlert, color: 'text-red-500' },
          { label: 'High Risk Sites', value: decision.activeRiskCount, sub: 'Budget Threshold', icon: TrendingDown, color: 'text-amber-500' }
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                    <stat.icon size={20} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium uppercase">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.sub}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* SECTION 3: COST VS BUDGET & WORKFORCE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COST VS BUDGET */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <Wallet className="text-primary" size={24} />
                  <h2 className="text-xl font-bold text-foreground">Cost vs Budget Reality</h2>
                </div>
                <div className="text-xs text-muted-foreground">Updated Now</div>
              </div>

              <div className="space-y-6">
                {financials.allProjectFinancials.slice(0, 3).map(f => (
                  <div key={f.projectId} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm font-bold text-foreground mb-0.5">{f.projectName}</div>
                        <div className="text-xs text-muted-foreground">Contract: {f.contractValue.toLocaleString()} EGP</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${f.grossRemaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {f.totalPayrollCost.toLocaleString()} EGP
                        </div>
                        <div className="text-xs text-muted-foreground">Burn: {f.payrollBurnRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, f.payrollBurnRate)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          f.payrollBurnRate > 90 ? 'bg-red-500' : 
                          f.payrollBurnRate > 70 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                      />
                    </div>
                    {f.grossRemaining < 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">
                        <AlertCircle size={10} /> ⚠️ LEAK: +{Math.abs(f.grossRemaining).toLocaleString()} Over Budget
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* LIVE SITE FEED */}
        <motion.div variants={item}>
          <Card className="bg-[#0B1120] border-white/10 h-full overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary animate-pulse" />
                  <span className="text-sm font-bold">Live Control Feed</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" /> REC
                </span>
              </div>
              <div className="flex-1 bg-black/40 p-4 font-mono text-[11px] text-primary/80 overflow-y-auto">
                <div className="space-y-2">
                  <div className="text-emerald-500">[14:15] System: Secure Connection Est.</div>
                  <div>[14:22] Gate: ID-723 Check-in (San Stefano)</div>
                  <div className="text-amber-500">[14:30] Alert: ID-105 Repeated Delay</div>
                  <div>[14:45] Log: Material Requisition #829 approved</div>
                  <div>[14:55] Site: Workforce count matched (18/25)</div>
                  <div className="text-red-500">[15:05] ALERT: Code GHOST-999 detected</div>
                  <div className="animate-pulse">_</div>
                </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase">Now on Site</div>
                    <div className="text-xl font-bold">18</div>
                  </div>
                  <div className="text-center p-2 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-muted-foreground uppercase">Late</div>
                    <div className="text-xl font-bold text-amber-500">4</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* SECTION 4: RISK RANKING & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RISK RANKING */}
        <motion.div variants={item}>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <TrendingDown className="text-red-500" size={24} />
                <h2 className="text-xl font-bold text-foreground">Site Risk Ranking</h2>
              </div>
              
              <div className="space-y-4">
                {financials.allProjectFinancials
                  .sort((a, b) => b.payrollBurnRate - a.payrollBurnRate)
                  .map((f, idx) => (
                    <div key={f.projectId} className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                      <div className="flex items-center gap-4">
                        <span className={`text-lg font-black italic ${idx === 0 ? 'text-red-500' : 'text-muted-foreground/30'}`}>#{idx + 1}</span>
                        <div>
                          <div className="text-sm font-bold text-foreground">{f.projectName}</div>
                          <div className={`text-[10px] uppercase font-bold tracking-widest ${
                            f.riskLevel === 'HIGH_RISK' ? 'text-red-500' : 
                            f.riskLevel === 'MEDIUM_RISK' ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {f.riskLevel.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{f.payrollBurnRate.toFixed(1)}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Burn Rate</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* GLOBAL DECISION BOARD */}
        <motion.div variants={item}>
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="text-primary" size={24} />
                <h2 className="text-xl font-bold text-foreground">Global Activity Feed</h2>
              </div>
              <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                {[
                  { time: '14:22', msg: 'Mahmoud Entered San Stefano Stage 1', type: 'info' },
                  { time: '14:30', msg: 'Ahmed Late arrival - 45 mins (Stage 2)', type: 'warn' },
                  { time: '14:55', msg: 'Material Requisition Approved - 3,200 EGP', type: 'info' },
                  { time: '15:10', msg: 'Anomaly Detected: Code GHOST-999', type: 'error' },
                ].map((log, i) => (
                  <div key={i} className="relative pl-8">
                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-[#0B1120] ${
                      log.type === 'error' ? 'bg-red-500' : log.type === 'warn' ? 'bg-amber-500' : 'bg-primary'
                    }`} />
                    <div className="text-[10px] text-muted-foreground font-mono mb-1">{log.time}</div>
                    <div className="text-sm text-foreground font-medium">{log.msg}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
