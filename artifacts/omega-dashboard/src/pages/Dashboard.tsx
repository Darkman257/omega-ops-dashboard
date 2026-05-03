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
  Target
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Dashboard() {
  const { projects, payrollRecords, employees } = useAppContext();
  const [mode, setMode] = useState<'OWNER' | 'OPS' | 'AI' | 'CONTRACTS'>('OWNER');

  const living = useMemo(() => calculateLivingSystem(projects, payrollRecords, employees), [projects, payrollRecords, employees]);

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

      {mode === 'CONTRACTS' ? (
        <ContractsFlow />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* 3. SYSTEM STABILITY (LEFT) */}
            <motion.div variants={container} className="lg:col-span-5 flex flex-col items-center justify-center space-y-8 py-12">
              <Card className="bg-black/60 backdrop-blur-3xl border-white/10 w-full max-w-sm neon-border overflow-hidden p-8 flex flex-col items-center justify-center space-y-6">
                <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                  System Stability / استقرار النظام
                </div>
                <div className="flex items-center gap-6">
                  <SystemStabilityBar value={living.verdict.state === 'BLEEDING' ? 35 : living.verdict.state === 'WARNING' ? 65 : 96} />
                  <div className="text-5xl font-black text-foreground tracking-tighter">
                    {living.verdict.state === 'BLEEDING' ? 35 : living.verdict.state === 'WARNING' ? 65 : 96}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-foreground uppercase tracking-widest">{living.verdict.label}</div>
                </div>
              </Card>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black tracking-tighter text-foreground uppercase">{living.verdict.explanationAr}</h2>
                <div className="flex gap-4 justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <Radio size={14} className="text-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Signal Stable</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                    <Network size={14} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Flow: Normal</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 4. AI INSIGHTS & NEURAL MAP (RIGHT) */}
            <div className="lg:col-span-7 space-y-8">
              {/* AI EXPLANATION BOX */}
              <Card className="bg-black/60 backdrop-blur-3xl border-white/10 neon-border overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="text-primary" size={24} />
                    <span className="text-xs font-black uppercase tracking-[0.4em]">Neural Reasoning Engine</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">What / الموقف</div>
                      <p className="text-lg font-bold text-foreground leading-tight neon-text-gold">{living.aiInsight.what}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Why / السبب</div>
                      <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">"{living.aiInsight.why}"</p>
                    </div>
                    <div className="space-y-2">
                      <div className="text-[10px] font-black text-red-500 uppercase tracking-widest">Next Impact / التأثير</div>
                      <p className="text-sm font-black text-red-500 leading-tight uppercase">{living.aiInsight.impact}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5 flex gap-4">
                    {living.actionsNow.map((action: string, i: number) => (
                      <button key={i} className="flex-1 bg-white/5 hover:bg-primary hover:text-black border border-white/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                        {action}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* NEURAL MAP VISUALIZATION */}
              <Card className="bg-black/40 border-white/10 glass-card h-[400px]">
                <CardContent className="p-6 h-full flex flex-col">
                  <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Radio size={16} className="text-primary" /> System Neural Map
                  </h3>
                  <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <XAxis type="number" dataKey="x" hide domain={[-300, 300]} />
                        <YAxis type="number" dataKey="y" hide domain={[-300, 300]} />
                        <ZAxis type="number" dataKey="z" range={[100, 1000]} />
                        <ReTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#000', border: 'none' }} />
                        <Scatter name="Sites" data={living.neural.nodes.map(n => ({ ...n, z: 500 }))} fill="#C9A84C">
                          {living.neural.nodes.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.status === 'CRITICAL' ? '#EF4444' : entry.status === 'WARNING' ? '#F59E0B' : '#C9A84C'} 
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    
                    {/* SVG Edge Layer */}
                    <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-20">
                      {living.neural.edges.map((edge, i) => {
                        const from = living.neural.nodes.find(n => n.id === edge.from);
                        const to = living.neural.nodes.find(n => n.id === edge.to);
                        if (!from || !to) return null;
                        return (
                          <motion.line
                            key={i}
                            x1="50%" y1="50%"
                            x2={`${50 + (to.x / 6)}%`} y2={`${50 + (to.y / 6)}%`}
                            stroke={edge.status === 'BROKEN' ? '#EF4444' : '#C9A84C'}
                            strokeWidth={1}
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        );
                      })}
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* OMEGA WAR ROOM LAYER */}
          <div className="space-y-6 mt-12 border-t border-white/10 pt-12 relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-primary" size={24} />
              <h2 className="text-2xl font-black tracking-widest uppercase text-foreground neon-text-gold">
                Omega War Room Layer
              </h2>
            </div>
            
            {/* Top Row: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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

          {/* 5. BOTTOM COMMAND STRIPS (REACTIVE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {[
              { label: 'Lost Today', value: living.summary.lostToday, sub: 'Leak Estimate', icon: TrendingDown, color: '#EF4444', spark: [300, 500, 400, 700, 600, 1000] },
              { label: 'Workforce', value: living.summary.workforce.present, sub: 'Active Now', icon: Users, color: '#C9A84C', spark: [10, 15, 12, 18, 17, 20] },
              { label: 'Active Sites', value: living.summary.activeSites, sub: 'Running Now', icon: Target, color: '#10B981', spark: [2, 3, 3, 4, 4, 5] },
              { label: 'Critical Risks', value: living.summary.criticalRisks, sub: 'Action Required', icon: ShieldAlert, color: '#F59E0B', spark: [0, 1, 2, 1, 2, 3] }
            ].map((stat, i) => (
              <motion.div key={i} variants={container} className="p-6 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center group hover:border-primary/50 transition-all">
                <div>
                  <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-2xl font-black">{stat.value}</div>
                </div>
                <stat.icon className={`${stat.color} group-hover:scale-125 transition-transform`} size={24} />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
