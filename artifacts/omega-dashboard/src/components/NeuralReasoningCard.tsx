import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Eye, Zap } from 'lucide-react';

interface NeuralReasoningCardProps {
  what: string;
  why: string;
  impact: string;
  actionsNow: string[];
}

export default function NeuralReasoningCard({ what, why, impact, actionsNow }: NeuralReasoningCardProps) {
  return (
    <div className="relative bg-black/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 h-full overflow-hidden flex flex-col justify-between group hover:border-primary/40 transition-all duration-700">
      <div className="absolute top-0 left-0 w-1 h-full bg-primary group-hover:scale-y-110 transition-transform origin-top duration-500" />
      
      <div className="relative z-10 flex flex-col justify-between h-full space-y-6">
        <div>
          {/* Top reasoning header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-primary group-hover:rotate-12 transition-all duration-500" size={24} />
              <span className="text-xs font-black uppercase tracking-[0.4em] text-foreground">
                Neural Reasoning Engine
              </span>
            </div>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold text-primary tracking-widest uppercase select-none"
            >
              <Zap size={10} className="animate-pulse" /> Live Analysis
            </motion.div>
          </div>

          {/* Core Reasoning Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 hover:bg-white/10 transition-colors">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                What / الموقف
              </div>
              <p className="text-base font-bold text-foreground leading-tight neon-text-gold">{what}</p>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 hover:bg-white/10 transition-colors">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Why / السبب
              </div>
              <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">"{why}"</p>
            </div>

            <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-2 hover:bg-white/10 transition-colors">
              <div className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                Next Impact / التأثير
              </div>
              <motion.p 
                animate={{ opacity: [1, 0.6, 1], scale: [1, 1.02, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-sm font-black text-red-500 leading-tight uppercase"
              >
                {impact}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Action Callouts */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Eye size={12} className="text-primary animate-pulse" /> Direct Impact Actions
          </div>
          <div className="grid grid-cols-2 gap-4">
            {actionsNow.map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="bg-white/5 hover:bg-primary hover:text-black border border-white/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left flex items-center justify-between group/btn"
              >
                <span>{action}</span>
                <span className="opacity-0 group-hover/btn:opacity-100 transition-opacity">→</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
