import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Network, Activity } from 'lucide-react';

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
  // Enhanced static custom nodes specifically tailored for Omega operations
  const customNodes: MapNode[] = [
    { id: 'projects', label: 'Projects', x: 25, y: 30, status: 'NORMAL' },
    { id: 'staff', label: 'Workforce', x: 75, y: 25, status: 'NORMAL' },
    { id: 'fleet', label: 'Fleet & Fleet', x: 20, y: 75, status: 'WARNING' },
    { id: 'payroll', label: 'Payroll Data', x: 70, y: 75, status: 'NORMAL' },
    { id: 'facilities', label: 'Housing / Supply', x: 50, y: 85, status: 'NORMAL' },
  ];

  // We integrate inputs from living.neural.nodes to make it extremely premium
  const combinedNodes = customNodes.map((cn) => {
    const liveMatch = nodes.find(n => n.id.toLowerCase().includes(cn.id));
    return {
      ...cn,
      status: liveMatch?.status || cn.status,
    };
  });

  return (
    <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 h-full min-h-[380px] overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all duration-700">
      {/* Dynamic scan line overlay */}
      <motion.div 
        animate={{ translateY: ['100%', '-100%'] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent pointer-events-none select-none z-0"
      />

      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Header Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Network className="text-primary group-hover:scale-110 transition-transform duration-500" size={24} />
            <span className="text-xs font-black uppercase tracking-[0.4em] text-foreground">
              Omega Operations Neural Network
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="text-emerald-500 animate-pulse" size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground select-none">
              Nodes Operational
            </span>
          </div>
        </div>

        {/* Dynamic Network Graphic with nodes */}
        <div className="flex-1 border border-white/5 bg-white/[0.02] rounded-xl relative p-4 overflow-hidden min-h-[220px]">
          <svg className="absolute inset-0 w-full h-full pointer-events-none select-none">
            {/* Center neon glow orbs & rings */}
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="50%" cy="50%" r="40" fill="url(#centerGlow)" className="animate-pulse" />

            {/* Pulsing Central Network lines connecting everything to center */}
            {combinedNodes.map((n, i) => (
              <motion.line
                key={i}
                x1="50%"
                y1="50%"
                x2={`${n.x}%`}
                y2={`${n.y}%`}
                stroke={n.status === 'CRITICAL' ? '#EF4444' : n.status === 'WARNING' ? '#F59E0B' : '#C9A84C'}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                animate={{ strokeDashoffset: [-20, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="opacity-40 group-hover:opacity-60 transition-opacity"
              />
            ))}
          </svg>

          {/* Central Hub Core */}
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-black border-4 border-primary rounded-full flex flex-col items-center justify-center z-20 shadow-[0_0_20px_rgba(201,168,76,0.3)] group cursor-pointer"
          >
            <div className="text-[8px] font-black uppercase text-primary tracking-widest text-center select-none">
              CORE
            </div>
          </motion.div>

          {/* Node items over the map */}
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
                className="absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center gap-2 group/node cursor-pointer select-none"
              >
                <div className={`w-3 h-3 rounded-full border-2 bg-black flex items-center justify-center relative hover:scale-125 transition-all duration-300`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                  <div className={`absolute inset-0 rounded-full ${statusColor} animate-ping opacity-40`} />
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/10 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/90 group-hover/node:text-primary transition-colors">
                  {n.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
