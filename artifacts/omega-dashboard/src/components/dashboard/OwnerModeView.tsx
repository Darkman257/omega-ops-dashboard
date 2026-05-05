import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingDown, 
  Users, 
  Target, 
  ShieldAlert,
  DollarSign,
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { LivingSystemData } from '@/lib/financials';
import { OperationalKpiCard } from '@/reference-patterns/omega/OperationalKpiCard';
import { WeatherRiskWidget } from '@/reference-patterns/omega/WeatherRiskWidget';
import { RealtimeOpsFeed } from '@/reference-patterns/omega/RealtimeOpsFeed';

interface OwnerModeViewProps {
  living: LivingSystemData;
  activeEmployees: number;
  totalEmployees: number;
  activeVehicles: number;
  pendingApprovals: number;
  cashBurnToday: number;
}

export const OwnerModeView: React.FC<OwnerModeViewProps> = ({
  living,
  activeEmployees,
  totalEmployees,
  activeVehicles,
  pendingApprovals,
  cashBurnToday
}) => {
  const stats = [
    { label: 'Lost Today', value: living.summary.lostToday, sub: 'Leak Estimate', icon: TrendingDown, color: 'text-red-500' },
    { label: 'Workforce', value: `${activeEmployees} / ${totalEmployees}`, sub: 'Active Now', icon: Users, color: 'text-primary' },
    { label: 'Active Sites', value: living.summary.activeSites, sub: 'Running Now', icon: Target, color: 'text-emerald-500' },
    { label: 'Critical Risks', value: living.summary.criticalRisks, sub: 'Action Required', icon: ShieldAlert, color: 'text-amber-500' }
  ];

  return (
    <div className="space-y-8">
      {/* Executive Decision Layer Title */}
      <div className="flex items-center gap-3">
        <Briefcase className="text-primary" size={24} />
        <h2 className="text-2xl font-black tracking-widest uppercase text-foreground neon-text-gold">
          Executive Decision Layer
        </h2>
      </div>

      {/* Financial & Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex justify-between items-center group hover:border-primary/50 transition-all"
          >
            <div>
              <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">{stat.label}</div>
              <div className="text-xl font-black">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground/60">{stat.sub}</div>
            </div>
            <stat.icon className={`${stat.color} group-hover:scale-110 transition-transform`} size={24} />
          </motion.div>
        ))}
      </div>

      {/* Decision Support Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <OperationalKpiCard 
          title="Daily Cash Burn" 
          value={Math.round(cashBurnToday)} 
          unit="EGP" 
          trend={living.verdict.state === 'BLEEDING' ? 15 : -2} 
          color={living.verdict.state === 'BLEEDING' ? 'amber' : 'emerald'} 
        />
        <OperationalKpiCard 
          title="Operational Risks" 
          value={living.summary.criticalRisks} 
          unit="Critical" 
          trend={living.summary.criticalRisks > 0 ? 10 : 0} 
          color="amber" 
        />
        <OperationalKpiCard 
          title="Asset Utilization" 
          value={Math.round((activeVehicles / (activeVehicles + 1)) * 100)} // Rough calculation if data limited
          unit="%" 
          trend={5.4} 
          color="cyan" 
        />
      </div>

      {/* War Room: Weather & Operational Context */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 h-full">
          <WeatherRiskWidget 
            siteName="Current Operations"
            temperature={38}
            condition="Operational Status"
            riskLevel={living.verdict.state === 'BLEEDING' ? 'Critical' : living.verdict.state === 'WARNING' ? 'High' : 'Low'}
            activeAlerts={living.whyReasons.length > 0 ? living.whyReasons : ["System Stable", "Data Flow Optimal"]}
          />
        </div>
        <div className="lg:col-span-8 h-full">
          <RealtimeOpsFeed title="Executive Command Stream" />
        </div>
      </div>
      
      {/* Financial Risks Card */}
      {living.verdict.state !== 'SAFE' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-red-500" size={24} />
            <h3 className="text-lg font-bold text-red-500 uppercase tracking-tighter">Critical Financial Warning</h3>
          </div>
          <p className="text-sm text-red-200/80 mb-4">{living.verdict.explanationAr}</p>
          <div className="flex flex-wrap gap-2">
            {living.actionsNow.map((action, i) => (
              <span key={i} className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-[10px] font-bold text-red-400 uppercase">
                {action}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
