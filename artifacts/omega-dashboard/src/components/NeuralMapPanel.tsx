import React from 'react';
import { motion } from 'framer-motion';
import { Network, Activity, Cpu } from 'lucide-react';

interface MapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  status?: string;
}

interface NeuralMapPanelProps {
  nodes: MapNode[];
}

export default function NeuralMapPanel({ nodes }: NeuralMapPanelProps) {
  // Enhanced compact custom nodes specifically tailored for Omega operations
  const customNodes: MapNode[] = [
    { id: 'projects', label: 'Projects', x: 30, y: 35, status: 'NORMAL' },
    { id: 'staff', label: 'Workforce', x: 70, y: 32, status: 'NORMAL' },
    { id: 'fleet', label: 'Fleet Hub', x: 25, y: 72, status: 'WARNING' },
    { id: 'payroll', label: 'Payroll', x: 75, y: 68, status: 'NORMAL' },
    { id: 'facilities', label: 'Facilities', x: 50, y: 82, status: 'NORMAL' },
  ];

  const combinedNodes = customNodes.map((cn) => {
    const liveMatch = nodes.find(n => n.id.toLowerCase().includes(cn.id));
    return {
      ...cn,
      status: liveMatch?.status || cn.status,
    };
  });

  return (
    <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 h-full min-h-[300px] overflow-hidden flex flex-col justify-between group hover:border-primary/40 hover:shadow-[0_0_20px_rgba(201,168,76,0.1)] transition-all duration-500 select-none">
      {/* Background grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />

      {/* Header Title */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="text-primary group-hover:scale-110 transition-transform duration-500" size={20} />
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
            Omega Operations Neural Network
          </span>
        </div>
        <div className="flex items-center gap-4">
          {/* Mini Legend */}
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Norm
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" /> Warn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Crit
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="text-emerald-500 animate-pulse" size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Nodes Dynamic
            </span>
          </div>
        </div>
      </div>

      {/* Connected Nodes Map */}
      <div className="relative z-10 flex-1 border border-white/5 bg-white/[0.01] rounded-xl relative overflow-hidden min-h-[220px]">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50%" cy="50%" r="35" fill="url(#mapGlow)" className="animate-pulse" />

          {combinedNodes.map((n, i) => (
            <motion.line
              key={i}
              x1="50%"
              y1="50%"
              x2={`${n.x}%`}
              y2={`${n.y}%`}
              stroke={n.status === 'CRITICAL' ? '#EF4444' : n.status === 'WARNING' ? '#F59E0B' : '#C9A84C'}
              strokeWidth={1.25}
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [-16, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="opacity-40 group-hover:opacity-60 transition-opacity"
            />
          ))}
        </svg>

        {/* Central Core */}
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-black border-2 border-primary rounded-full flex flex-col items-center justify-center z-20 shadow-[0_0_20px_rgba(201,168,76,0.3)] hover:scale-105 duration-300 transition-transform cursor-pointer"
        >
          <Cpu size={14} className="text-primary animate-pulse mb-0.5" />
          <div className="text-[7px] font-black uppercase text-primary tracking-widest text-center">
            HUB
          </div>
        </motion.div>

        {/* Dynamic Map Nodes */}
        {combinedNodes.map((n) => {
          const isCritical = n.status === 'CRITICAL';
          const isWarning = n.status === 'WARNING';
          const statusColor = isCritical 
            ? 'bg-red-500 border-red-500/40' 
            : isWarning 
            ? 'bg-yellow-500 border-yellow-500/40' 
            : 'bg-emerald-500 border-emerald-500/40';

          return (
            <motion.div
              key={n.id}
              style={{ left: `${n.x}%`, top: `${n.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 group/node cursor-pointer select-none"
            >
              <div className="w-2.5 h-2.5 rounded-full border bg-black flex items-center justify-center relative hover:scale-110 duration-300 transition-all">
                <div className={`w-1 h-1 rounded-full ${statusColor}`} />
                <div className={`absolute inset-0 rounded-full ${statusColor} animate-ping opacity-30`} />
              </div>
              <div className="bg-black/70 backdrop-blur-md border border-white/10 px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider text-white/90 group-hover/node:text-primary transition-colors">
                {n.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
