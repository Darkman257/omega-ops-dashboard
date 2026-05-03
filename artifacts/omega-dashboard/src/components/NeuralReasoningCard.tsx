import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Eye, Zap, ShieldAlert } from 'lucide-react';

interface NeuralReasoningCardProps {
  what: string;
  why: string;
  impact: string;
  actionsNow: string[];
}

export default function NeuralReasoningCard({ what, why, impact, actionsNow }: NeuralReasoningCardProps) {
  return (
    <div className="relative bg-[#0A0A0A]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-5 h-full min-h-[220px] overflow-hidden flex flex-col justify-between group hover:border-primary/40 hover:shadow-[0_0_20px_rgba(201,168,76,0.1)] transition-all duration-500">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:scale-y-110 transition-transform origin-top duration-500 pointer-events-none select-none" />

      {/* Grid background overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
        {/* Top header reasoning engine */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-primary group-hover:rotate-6 transition-all duration-500" size={20} />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">
              Neural Reasoning Engine
            </span>
          </div>
          <div className="flex items-center gap-2 select-none">
            <div className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1">
              <ShieldAlert size={10} className="animate-pulse" /> High Severity
            </div>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-bold text-primary tracking-widest uppercase flex items-center gap-1"
            >
              <Zap size={10} className="animate-pulse" /> Direct Feedback
            </motion.div>
          </div>
        </div>

        {/* Dense content boxes (The 3 Lanes) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 hover:bg-white/[0.04] transition-colors h-full flex flex-col justify-between">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
              What / الموقف
            </div>
            <p className="text-sm font-bold text-foreground leading-snug neon-text-gold">{what}</p>
          </div>
          
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 hover:bg-white/[0.04] transition-colors h-full flex flex-col justify-between">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">
              Why / السبب
            </div>
            <p className="text-xs font-medium text-foreground/80 leading-relaxed italic line-clamp-2">"{why}"</p>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 hover:bg-white/[0.04] transition-colors h-full flex flex-col justify-between">
            <div className="text-[9px] font-black text-red-500 uppercase tracking-wider flex items-center gap-1">
              Next Impact / التأثير
            </div>
            <motion.p 
              animate={{ opacity: [1, 0.7, 1], scale: [1, 1.01, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-xs font-black text-red-500 leading-snug uppercase tracking-wide"
            >
              {impact}
            </motion.p>
          </div>
        </div>

        {/* Action Callouts */}
        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 select-none">
          <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Eye size={12} className="text-primary animate-pulse" /> Direct Command Directives
          </div>
          <div className="flex flex-wrap gap-2">
            {actionsNow.map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/5 hover:bg-primary hover:text-black border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1"
              >
                <span>{action}</span>
                <span className="opacity-0 hover:opacity-100 transition-opacity">→</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
