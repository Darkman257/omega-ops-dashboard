import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  BrainCircuit, 
  TrendingDown, 
  Users, 
  Wallet,
  Zap,
  Flame,
  UserX,
  Target,
  Briefcase,
  Activity,
  AlertTriangle,
  Eye,
  TrendingUp,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { calculateOwnerMode, getGlobalFinancials } from '@/lib/financials';

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

const COLORS = ['#C9A84C', '#3B82F6', '#10B981', '#EF4444', '#F59E0B'];

export default function Dashboard() {
  const { projects, payrollRecords, employees } = useAppContext();

  const owner = useMemo(() => calculateOwnerMode(projects, payrollRecords, employees), [projects, payrollRecords, employees]);
  const financials = useMemo(() => getGlobalFinancials(projects, payrollRecords, employees), [projects, payrollRecords, employees]);

  // Data for Charts
  const payrollData = useMemo(() => {
    return financials.allProjectFinancials.map(f => ({
      name: f.projectName.substring(0, 10) + '...',
      value: f.totalPayrollCost
    })).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [financials]);

  const burnData = useMemo(() => {
    return financials.allProjectFinancials.map((f, i) => ({
      name: f.projectName,
      uv: f.payrollBurnRate,
      fill: f.payrollBurnRate > 90 ? '#EF4444' : f.payrollBurnRate > 70 ? '#F59E0B' : '#C9A84C'
    })).slice(0, 3);
  }, [financials]);

  const attendanceData = [
    { name: 'Present', value: owner.snapshot.workforce.present },
    { name: 'Late', value: owner.snapshot.workforce.late },
    { name: 'Absent', value: owner.snapshot.workforce.absent }
  ];

  const budgetActualData = useMemo(() => {
    return financials.allProjectFinancials.map(f => ({
      name: f.projectName.substring(0, 10),
      Budget: f.contractValue,
      Actual: f.totalPayrollCost
    })).slice(0, 4);
  }, [financials]);

  const stateGlow = owner.verdict.state === 'BLEEDING' ? 'shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 
                    owner.verdict.state === 'WARNING' ? 'shadow-[0_0_50px_rgba(245,158,11,0.2)]' : 
                    'shadow-[0_0_50px_rgba(16,185,129,0.2)]';

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12 relative"
    >
      {/* Background Cyber-Grid Effect */}
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20 z-[-1]" />
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none z-[-1]" />

      {/* 1. TOP COMMAND KPI STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lost Today', value: owner.summary.lostToday, sub: 'Leak Estimate', icon: TrendingDown, color: '#EF4444', spark: [300, 500, 400, 700, 600, 1000] },
          { label: 'Workforce', value: owner.summary.workforce.present, sub: 'Active Now', icon: Users, color: '#C9A84C', spark: [10, 15, 12, 18, 17, 20] },
          { label: 'Active Sites', value: owner.summary.activeSites, sub: 'Running Now', icon: Target, color: '#10B981', spark: [2, 3, 3, 4, 4, 5] },
          { label: 'Critical Risks', value: owner.summary.criticalRisks, sub: 'Action Required', icon: ShieldAlert, color: '#F59E0B', spark: [0, 1, 2, 1, 2, 3] }
        ].map((stat, i) => (
          <motion.div key={i} variants={item}>
            <Card className="bg-black/40 backdrop-blur-xl border-white/10 overflow-hidden relative group hover:border-primary/50 transition-all">
              <CardContent className="p-0">
                <div className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</span>
                    <stat.icon size={16} style={{ color: stat.color }} />
                  </div>
                  <div className="text-3xl font-black tracking-tighter text-foreground">{stat.value.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{stat.sub}</div>
                </div>
                <div className="h-16 w-full opacity-30 group-hover:opacity-60 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stat.spark.map(v => ({ v }))}>
                      <defs>
                        <linearGradient id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={stat.color} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={stat.color} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={stat.color} fillOpacity={1} fill={`url(#grad-${i})`} strokeWidth={2} isAnimationActive={true} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 2. EXECUTIVE COMMAND CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* VERDICT & WHY */}
        <motion.div variants={item} className="lg:col-span-8 space-y-6">
          <div className={`p-10 rounded-[2.5rem] border-2 relative overflow-hidden transition-all duration-700 glass-card ${stateGlow} ${
            owner.verdict.state === 'BLEEDING' ? 'border-red-500/30' : owner.verdict.state === 'WARNING' ? 'border-amber-500/30' : 'border-emerald-500/30'
          }`}>
            <div className="scanline" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="shrink-0">
                <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center relative ${
                  owner.verdict.state === 'BLEEDING' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
                  owner.verdict.state === 'WARNING' ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 
                  'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                }`}>
                  <Activity size={48} className="animate-pulse" />
                  <div className="absolute inset-[-10px] rounded-full border border-white/5 animate-spin-slow" />
                </div>
              </div>
              <div className="text-center md:text-left space-y-2">
                <div className="text-xs font-black uppercase tracking-[0.5em] opacity-50">Omega Insight Engine</div>
                <h1 className={`text-6xl font-black tracking-tighter uppercase mb-2 ${
                  owner.verdict.state === 'BLEEDING' ? 'neon-text-red text-red-500' : 
                  owner.verdict.state === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {owner.verdict.label}
                </h1>
                <p className="text-2xl font-bold tracking-tight text-foreground/90 dir-rtl">
                  {owner.verdict.explanationAr}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* WHY PANEL */}
            <Card className="bg-black/40 border-white/10 glass-card">
              <CardContent className="p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                  <AlertTriangle size={16} /> Why? / الأسباب
                </h3>
                <div className="space-y-4">
                  {owner.whyReasons.map((reason, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 rounded-xl bg-white/5 border border-white/5 group hover:border-primary/30 transition-all">
                      <div className="w-1 h-6 bg-primary rounded-full" />
                      <p className="text-sm font-bold text-foreground/80 leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ACTION NOW */}
            <Card className="bg-black/40 border-white/10 glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Zap size={64} className="text-primary" />
              </div>
              <CardContent className="p-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 flex items-center gap-2">
                  <Zap size={16} /> Action Now / افعل الآن
                </h3>
                <div className="space-y-4">
                  {owner.actionsNow.map((action, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ x: 10 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer"
                    >
                      <p className="text-sm font-black text-foreground">{action}</p>
                      <ArrowRight size={16} className="text-emerald-500" />
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* 3. VISUAL METRICS (SIDEBAR) */}
        <motion.div variants={item} className="lg:col-span-4 space-y-6">
          {/* Burn Rate Radial */}
          <Card className="bg-black/40 border-white/10 glass-card">
            <CardContent className="p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Site Burn Intensity</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="30%" outerRadius="100%" barSize={10} data={burnData}>
                    <RadialBar label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} background dataKey="uv" />
                    <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1F2937', color: '#fff' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Pie */}
          <Card className="bg-black/40 border-white/10 glass-card">
            <CardContent className="p-6 text-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 text-left">Workforce Allocation</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {attendanceData.map((d, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">{d.name}</span>
                    <span className="text-sm font-bold" style={{ color: COLORS[i] }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 4. DATA GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payroll by Project (Bar) */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-white/10 glass-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                <Wallet size={16} /> Payroll Distribution (EGP)
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                    <XAxis dataKey="name" stroke="#6B7280" fontSize={10} />
                    <YAxis stroke="#6B7280" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1F2937' }} />
                    <Bar dataKey="value" fill="#C9A84C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget vs Actual (Horizontal Bar) */}
        <motion.div variants={item}>
          <Card className="bg-black/40 border-white/10 glass-card">
            <CardContent className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
                <Briefcase size={16} /> Budget vs Actual Variance
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={budgetActualData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                    <XAxis type="number" stroke="#6B7280" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0B1120', border: '1px solid #1F2937' }} />
                    <Legend />
                    <Bar dataKey="Budget" fill="#1F2937" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Actual" fill="#C9A84C" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 5. OFFENDERS & LIVE INTEL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Worker Risk Ranking */}
        <motion.div variants={item} className="lg:col-span-5">
          <Card className="bg-black/40 border-white/10 glass-card h-full">
            <CardContent className="p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-red-500 mb-8 flex items-center gap-2">
                <UserX size={16} /> Top Risk Offenders
              </h3>
              <div className="space-y-4">
                {owner.offenders.worker !== 'N/A' ? (
                  <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-12 -mt-12" />
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className="text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">Critical Offender</div>
                        <div className="text-xl font-black text-foreground">ID: {owner.offenders.worker}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-red-500">CRITICAL</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">Risk Level</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm italic">Clean workforce state.</div>
                )}
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground uppercase font-black mb-1">Max Overtime</div>
                    <div className="text-sm font-bold text-primary">{owner.snapshot.payroll.overtime.toLocaleString()} EGP</div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="text-[10px] text-muted-foreground uppercase font-black mb-1">ID Anomalies</div>
                    <div className="text-sm font-bold text-red-500">{owner.snapshot.workforce.missingAttendance} Found</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* LIVE INTELLIGENCE */}
        <motion.div variants={item} className="lg:col-span-7">
          <Card className="bg-[#0B1120] border-white/10 h-full overflow-hidden relative">
            <div className="scanline" />
            <CardContent className="p-0 flex flex-col h-full">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                  <Eye size={16} className="text-primary animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Neural Activity Feed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black text-red-500 uppercase">Live Audit</span>
                </div>
              </div>
              <div className="flex-1 bg-black/40 p-6 font-mono text-xs text-primary/80 overflow-y-auto max-h-[300px] custom-scrollbar">
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {financials.leaks.length > 0 ? financials.leaks.slice(0, 5).map((leak, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-4 border-l-2 border-primary/20 pl-4 py-1"
                      >
                        <span className="opacity-30 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                        <span className={leak.severity === 'CRITICAL' ? 'text-red-500' : 'text-foreground'}>
                          <span className="font-bold">{leak.type}:</span> {leak.description}
                        </span>
                      </motion.div>
                    )) : (
                      <div className="text-center opacity-40 py-12 flex flex-col items-center gap-4">
                        <Layers size={40} className="animate-pulse" />
                        <p>AWAITING DATA INGESTION...</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <span>System: v2.5.0-Intelligence</span>
                <span>Uptime: 100%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
