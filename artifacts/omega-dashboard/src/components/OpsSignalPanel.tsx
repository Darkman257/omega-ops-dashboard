import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Network, ShieldAlert, Cpu } from 'lucide-react';
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
    <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 h-full overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all duration-700">
      {/* Scanning laser effect line */}
      <motion.div
        animate={{ translateY: ['0%', '300%', '0%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none"
      />
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Cpu className="text-primary animate-pulse" size={24} />
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-foreground">
                Ops Intelligence Signal
              </h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md flex items-center gap-2 ${statusColor}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isBleeding ? 'bg-red-500 animate-ping' : isWarning ? 'bg-yellow-500' : 'bg-primary'}`} />
              {verdict.label}
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Network size={12} className="text-emerald-500" /> System Stability
                </div>
                <div className="text-3xl font-black tracking-tighter text-foreground">{stabilityValue}%</div>
              </div>
              <SystemStabilityBar value={stabilityValue} />
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Radio size={12} className="text-primary animate-pulse" /> Signal Stream
                </div>
                <div className="text-base font-black tracking-widest uppercase text-primary/80">Continuous</div>
              </div>
              <div className="flex items-end gap-0.5 h-10">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [1, 1.8, 1], translateY: [0, -3, 0] }}
                    transition={{ duration: 1 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-1 bg-primary/40 group-hover:bg-primary h-6 rounded-t-sm"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Arabic / Explanation */}
        <div className="pt-4 border-t border-white/5 flex flex-col justify-between space-y-4">
          <h2 className="text-3xl font-black tracking-tighter text-foreground uppercase neon-text-gold">
            {verdict.explanationAr}
          </h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl">
              <ShieldAlert size={14} className={isBleeding ? 'text-red-500 animate-bounce' : 'text-primary'} />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Operational Defense: Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
