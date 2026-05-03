import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Network, ShieldAlert, Cpu, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import SystemStabilityBar from './SystemStabilityBar';

interface OpsSignalPanelProps {
  verdict: {
    label: string;
    state: 'STABLE' | 'WARNING' | 'BLEEDING' | 'SAFE';
    explanationAr: string;
  };
  stabilityValue: number;
}

export default function OpsSignalPanel({ verdict, stabilityValue }: OpsSignalPanelProps) {
  const isBleeding = verdict.state === 'BLEEDING';
  const isWarning = verdict.state === 'WARNING';
  
  const statusColor = isBleeding 
    ? 'text-red-500 border-red-500/30 bg-red-500/5' 
    : isWarning 
    ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5' 
    : 'text-primary border-primary/30 bg-primary/5';

  return (
    <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 h-full min-h-[220px] overflow-hidden flex flex-col justify-between group hover:border-primary/40 hover:shadow-[0_0_20px_rgba(201,168,76,0.1)] transition-all duration-500">
      {/* Scanning laser line overlay */}
      <motion.div
        animate={{ translateY: ['0%', '350%', '0%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none select-none"
      />
      
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="text-primary group-hover:rotate-90 transition-transform duration-500" size={20} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
            Ops Intelligence Signal
          </h3>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-1.5 ${statusColor}`}>
          <div className={`w-1 h-1 rounded-full ${isBleeding ? 'bg-red-500 animate-ping' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`} />
          {verdict.label}
        </div>
      </div>

      {/* High-density compact metrics stack */}
      <div className="relative z-10 grid grid-cols-2 gap-3 my-4">
        {/* System Stability */}
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between hover:bg-white/[0.04] transition-all">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
            <Network size={11} className="text-emerald-500" /> Stability
          </div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-black tracking-tighter text-foreground leading-none">{stabilityValue}%</div>
            <SystemStabilityBar value={stabilityValue} />
          </div>
        </div>

        {/* Sync Stream */}
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between hover:bg-white/[0.04] transition-all">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
            <Radio size={11} className="text-primary" /> Data Stream
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-black tracking-widest uppercase text-emerald-400">Live & Stable</div>
            <div className="flex items-end gap-0.5 h-6">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 1.8, 1], translateY: [0, -2, 0] }}
                  transition={{ duration: 1 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-0.5 bg-primary/40 h-5 rounded-t-sm"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Data Sync Rate */}
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-all">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-cyan-400 animate-spin-slow" />
            <div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Data Sync</div>
              <div className="text-xs font-bold text-foreground leading-none mt-0.5">0.4ms latency</div>
            </div>
          </div>
        </div>

        {/* Risk Index */}
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-all">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={isBleeding ? 'text-red-500' : 'text-primary'} />
            <div>
              <div className="text-[8px] font-black text-muted-foreground uppercase tracking-wider">Risk Index</div>
              <div className="text-xs font-bold text-foreground leading-none mt-0.5">
                {isBleeding ? 'HIGH' : isWarning ? 'MEDIUM' : 'LOW'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Arabic / Confidence */}
      <div className="relative z-10 pt-3 border-t border-white/5 flex flex-col justify-between space-y-2">
        <h2 className="text-xl font-black tracking-tighter text-foreground uppercase leading-none neon-text-gold">
          {verdict.explanationAr}
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-xl">
            <ShieldCheck size={12} className={isBleeding ? 'text-red-500' : 'text-primary'} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Security Matrix: Intact
            </span>
          </div>
          <div className="text-[9px] font-black uppercase text-primary tracking-widest flex items-center gap-1">
            <span className="w-1 h-1 bg-primary rounded-full animate-pulse" /> AI Conf: 98.4%
          </div>
        </div>
      </div>
    </div>
  );
}
