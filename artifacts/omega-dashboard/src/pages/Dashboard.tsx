import React, { useMemo, useState, useEffect } from 'react';
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
import { useAttendanceMetrics } from '@/hooks/useAttendanceMetrics';
import { supabase } from '@/lib/supabase';
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

import { buildAiInsights } from '@/lib/aiInsights';
import { OwnerModeView } from '@/components/dashboard/OwnerModeView';
import { OpsModeView } from '@/components/dashboard/OpsModeView';
import { AiModeView } from '@/components/dashboard/AiModeView';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const lastSentAlertsCache: Record<string, number> = {};

export default function Dashboard() {
  const { projects, payrollRecords, employees, vehicles, documents } = useAppContext();
  const [mode, setMode] = useState<'OWNER' | 'OPS' | 'AI' | 'CONTRACTS'>('OWNER');
  const [handledAlerts, setHandledAlerts] = useState<string[]>([]);
  const [autonomyMode, setAutonomyMode] = useState<'OFF' | 'ASSISTED' | 'AUTO_SAFE'>('AUTO_SAFE');

  const living = useMemo(() => calculateLivingSystem(projects, payrollRecords, employees), [projects, payrollRecords, employees]);
  const attendanceMetrics = useAttendanceMetrics();

  const totalEmployees = (employees || []).length;
  const activeEmployees = attendanceMetrics.hasLiveData
    ? attendanceMetrics.present + attendanceMetrics.nightShift + attendanceMetrics.offsite
    : (employees || []).filter(e => e.status === 'Active').length || 0;
  const activeVehicles = (vehicles || []).filter(v => v.status === 'Active' || v.status === 'In Service').length || 0;
  const pendingApprovals = (documents || []).filter(d => d.expiryDate && new Date(d.expiryDate) < new Date()).length || 0;
  const cashBurnToday = (payrollRecords || []).reduce((sum, r) => sum + (r.netSalary || 0), 0) / 30;

  // AI Insights Generation
  const aiSummary = useMemo(() => buildAiInsights({
    employees,
    vehicles,
    payrollRecords,
    projects,
    attendanceMetrics,
    activeEmployees,
    activeVehicles,
    cashBurnToday
  }), [employees, vehicles, payrollRecords, projects, attendanceMetrics, activeEmployees, activeVehicles, cashBurnToday]);

  const context = useMemo(() => {
    const today = new Date();
    const day = today.getDay();
    const isWeekend = day === 5 || day === 6;
    const hour = today.getHours();

    return {
      dayType: isWeekend ? 'weekend' : 'weekday',
      shiftType: hour >= 6 && hour < 18 ? 'day' : 'night',
      projectPhase: 'execution',
      weatherCondition: 'normal'
    };
  }, []);

  const alertConfig = useMemo(() => ({
    workers: context.dayType === 'weekday' ? 65 : 40,
    fleet: context.projectPhase === 'mobilization' ? 60 : 40,
    burnRate: 35000,
    allowBurnSpike: false
  }), [context]);

  const proactiveAlerts = useMemo(() => {
    const alerts: { id: string; label: string; severity: 'NORMAL' | 'WARNING' | 'CRITICAL'; time: string }[] = [];
    const laborRate = totalEmployees > 0 ? (activeEmployees / totalEmployees) * 100 : 0;
    const inactiveVehicleRate = vehicles.length > 0 ? ((vehicles.length - activeVehicles) / vehicles.length) * 100 : 0;

    const workersThreshold = alertConfig.workers;
    if (laborRate < workersThreshold) {
      alerts.push({
        id: 'labor',
        label: `Workers threshold exceeded. Rate: ${laborRate.toFixed(1)}%.`,
        severity: 'WARNING',
        time: 'Just now'
      });
    }

    const fleetThreshold = alertConfig.fleet;
    if (inactiveVehicleRate > fleetThreshold) {
      alerts.push({
        id: 'fleet',
        label: `Fleet inactivity exceeds limit. Rate: ${inactiveVehicleRate.toFixed(1)}%.`,
        severity: 'WARNING',
        time: 'Just now'
      });
    }

    if (pendingApprovals > 0) {
      alerts.push({
        id: 'approvals',
        label: `${pendingApprovals} unresolved alerts or expirations detected.`,
        severity: 'CRITICAL',
        time: 'Just now'
      });
    }

    const burnThreshold = alertConfig.burnRate;
    if (cashBurnToday > burnThreshold && !alertConfig.allowBurnSpike) {
      alerts.push({
        id: 'finance',
        label: `Daily financial burn high. Value: ${Math.round(cashBurnToday).toLocaleString()} EGP.`,
        severity: 'WARNING',
        time: 'Just now'
      });
    }

    return alerts.filter(a => !handledAlerts.includes(a.id));
  }, [totalEmployees, activeEmployees, vehicles.length, activeVehicles, pendingApprovals, cashBurnToday, handledAlerts, context, alertConfig]);

  const overallSeverity = useMemo(() => {
    if (proactiveAlerts.some(a => a.severity === 'CRITICAL')) return 'CRITICAL';
    if (proactiveAlerts.some(a => a.severity === 'WARNING')) return 'WARNING';
    return 'NORMAL';
  }, [proactiveAlerts]);

  useEffect(() => {
    proactiveAlerts.forEach((alert) => {
      if (alert.severity === 'CRITICAL') {
        const now = Date.now();
        const lastSent = lastSentAlertsCache[alert.id] || 0;
        if (now - lastSent > 600000) {
          lastSentAlertsCache[alert.id] = now;
          console.log(`[ALERT SENT] ${alert.label}`);
        }
      }
    });
  }, [proactiveAlerts]);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12 relative overflow-hidden min-h-screen"
    >
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none z-[-1]" />
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full animate-pulse-slow" />
      </div>

      {/* MODE SWITCHER */}
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

      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto px-1"
        >
          {mode === 'OWNER' && (
            <OwnerModeView 
              living={living}
              activeEmployees={activeEmployees}
              totalEmployees={totalEmployees}
              activeVehicles={activeVehicles}
              pendingApprovals={pendingApprovals}
              cashBurnToday={cashBurnToday}
            />
          )}
          {mode === 'OPS' && (
            <OpsModeView 
              living={living}
              activeEmployees={activeEmployees}
              totalEmployees={totalEmployees}
              activeVehicles={activeVehicles}
              vehicles={vehicles}
              attendanceMetrics={attendanceMetrics}
              housingUnits={[]} // Add housingUnits if available in context
            />
          )}
          {mode === 'AI' && (
            <AiModeView aiSummary={aiSummary} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
