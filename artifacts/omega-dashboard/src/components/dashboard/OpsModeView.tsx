import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Truck, 
  Home, 
  Activity, 
  MapPin, 
  Radio,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Zap,
  Radar,
  Info,
  AlertTriangle
} from 'lucide-react';
import { LivingSystemData } from '@/lib/financials';
import { RealtimeOpsFeed } from '@/reference-patterns/omega/RealtimeOpsFeed';
import { AttendanceMetrics } from '@/hooks/useAttendanceMetrics';
import { OpsMaestroReport } from '@/lib/opsInsights';

interface OpsModeViewProps {
  living: LivingSystemData;
  activeEmployees: number;
  totalEmployees: number;
  activeVehicles: number;
  vehicles: any[];
  attendanceMetrics: AttendanceMetrics;
  housingUnits: any[];
  maestroReport: OpsMaestroReport;
}

export const OpsModeView: React.FC<OpsModeViewProps> = ({
  living,
  activeEmployees,
  totalEmployees,
  activeVehicles,
  vehicles,
  attendanceMetrics,
  housingUnits,
  maestroReport
}) => {
  const opsStats = [
    { label: 'Labor Force', value: activeEmployees, total: totalEmployees, icon: Users, color: 'text-emerald-400', desc: 'On duty now' },
    { label: 'Fleet Status', value: activeVehicles, total: vehicles.length, icon: Truck, color: 'text-cyan-400', desc: 'Active units' },
    { label: 'Housing', value: housingUnits.reduce((acc, u) => acc + (u.occupants || 0), 0), total: housingUnits.reduce((acc, u) => acc + (u.capacity || 0), 0), icon: Home, color: 'text-amber-400', desc: 'Beds occupied' }
  ];

  return (
    <div className="space-y-8">
      {/* Field Execution Layer Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radio className="text-cyan-400 animate-pulse" size={24} />
          <h2 className="text-2xl font-black tracking-widest uppercase text-foreground neon-text-cyan">
            Field Execution Layer
          </h2>
        </div>
        <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          maestroReport.overallRisk === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
          maestroReport.overallRisk === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
        }`}>
          <ShieldAlert size={12} />
          {maestroReport.overallRisk} System State
        </div>
      </div>

      {/* Maestro Intelligence Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* A) Operational Diagnosis */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-4 p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-cyan-400" size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Operational Diagnosis</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Labor Force', text: maestroReport.diagnosis.labor, icon: Users },
              { label: 'Fleet Readiness', text: maestroReport.diagnosis.fleet, icon: Truck },
              { label: 'Housing Status', text: maestroReport.diagnosis.housing, icon: Home },
              { label: 'Attendance Feed', text: maestroReport.diagnosis.attendance, icon: Clock },
              { label: 'Deployment', text: maestroReport.diagnosis.deployment, icon: MapPin }
            ].map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[9px] font-black uppercase text-muted-foreground/60 flex items-center gap-1">
                  <d.icon size={10} /> {d.label}
                </div>
                <p className="text-[11px] font-bold text-foreground leading-tight">{d.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* B) Immediate Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-5 p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-amber-400" size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Immediate Maestro Actions</h3>
          </div>
          <div className="space-y-2">
            {maestroReport.immediateActions.length > 0 ? (
              maestroReport.immediateActions.map((action, i) => (
                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-start gap-3 group hover:border-amber-500/30 transition-all">
                  <div className="mt-0.5 text-amber-500 font-black text-[10px]">{i + 1}</div>
                  <p className="text-[11px] font-bold text-amber-100/90 leading-tight">{action}</p>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-[10px] text-muted-foreground italic">No immediate actions required. System stable.</div>
            )}
          </div>
        </motion.div>

        {/* C) Missing Data Radar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Radar className="text-purple-400" size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Missing Data Radar</h3>
          </div>
          <div className="space-y-2">
            {maestroReport.missingDataRadar.map((missing, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                <AlertTriangle size={10} className="text-red-500" />
                <span className="text-[10px] font-bold text-red-200/70">{missing}</span>
              </div>
            ))}
            {maestroReport.missingDataRadar.length === 0 && (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500/20 mb-2" size={24} />
                <p className="text-[9px] font-black text-emerald-500/40 uppercase tracking-widest">Full Data Integrity</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Live Operational Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {opsStats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/30 transition-all"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <stat.icon size={64} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <stat.icon size={16} className={stat.color} />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">{stat.value}</span>
                {stat.total > 0 && <span className="text-sm text-muted-foreground">/ {stat.total}</span>}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 font-bold">{stat.desc}</div>
              
              <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
                  className={`h-full ${stat.color.replace('text-', 'bg-')}`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Attendance & Site Summary */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Clock size={14} className="text-emerald-400" /> Attendance Breakdown
            </h3>
            {attendanceMetrics.hasLiveData ? (
              <div className="space-y-4">
                {[
                  { label: 'Present', count: attendanceMetrics.present, color: 'bg-emerald-500' },
                  { label: 'Offsite', count: attendanceMetrics.offsite, color: 'bg-cyan-500' },
                  { label: 'Night Shift', count: attendanceMetrics.nightShift, color: 'bg-purple-500' },
                  { label: 'Absent', count: attendanceMetrics.absent, color: 'bg-red-500' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs font-bold text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-black">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground font-bold italic">
                Waiting for live attendance feed...
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <MapPin size={14} className="text-primary" /> Active Site Deployment
            </h3>
            <div className="space-y-3">
              {living.snapshot.projects.total > 0 ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-[10px] font-black uppercase text-foreground">Highest Burn Site</span>
                  <span className="text-[10px] font-bold text-amber-400">{living.snapshot.projects.highestBurn}</span>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground italic">No projects connected.</div>
              )}
            </div>
          </div>
        </div>

        {/* Live Operations Stream */}
        <div className="lg:col-span-8">
          <RealtimeOpsFeed title="Field Operational Stream" />
        </div>
      </div>
    </div>
  );
};
