import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BrainCircuit, 
  ShieldAlert, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  Database,
  Cpu,
  Info
} from 'lucide-react';
import { AiSummary, AiInsight } from '@/lib/aiInsights';

interface AiModeViewProps {
  aiSummary: AiSummary;
}

export const AiModeView: React.FC<AiModeViewProps> = ({ aiSummary }) => {
  return (
    <div className="space-y-8">
      {/* AI Reasoning Layer Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-purple-400 animate-pulse" size={24} />
          <h2 className="text-2xl font-black tracking-widest uppercase text-foreground neon-text-purple">
            AI Reasoning Layer
          </h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
          <Cpu size={12} className="text-purple-400" />
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
            Deterministic Engine V2.0
          </span>
        </div>
      </div>

      {/* Global Status Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-2xl border backdrop-blur-xl ${
          aiSummary.overallRisk === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20' :
          aiSummary.overallRisk === 'WARNING' ? 'bg-amber-500/10 border-amber-500/20' :
          'bg-emerald-500/10 border-emerald-500/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">System Threat Assessment</div>
            <div className={`text-4xl font-black uppercase tracking-tighter ${
              aiSummary.overallRisk === 'CRITICAL' ? 'text-red-500' :
              aiSummary.overallRisk === 'WARNING' ? 'text-amber-500' :
              'text-emerald-500'
            }`}>
              {aiSummary.overallRisk}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Data Integrity</div>
            <div className="text-xs font-bold text-foreground flex items-center justify-end gap-2">
              <span className={`w-2 h-2 rounded-full ${
                aiSummary.dataQuality === 'full' ? 'bg-emerald-500' :
                aiSummary.dataQuality === 'partial' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              {aiSummary.dataQuality.toUpperCase()} FEED
            </div>
          </div>
        </div>
        
        {aiSummary.missingFeeds.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Pending Data Links:</div>
            <div className="flex flex-wrap gap-2">
              {aiSummary.missingFeeds.map((feed, i) => (
                <span key={i} className="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[9px] font-bold text-muted-foreground">
                  {feed}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {aiSummary.insights.length > 0 ? (
            aiSummary.insights.map((insight, i) => (
              <motion.div 
                key={insight.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className={`p-5 rounded-2xl border bg-black/40 backdrop-blur-md relative overflow-hidden group hover:scale-[1.02] transition-all ${
                  insight.severity === 'critical' ? 'border-red-500/20 hover:border-red-500/40' :
                  insight.severity === 'warning' ? 'border-amber-500/20 hover:border-amber-500/40' :
                  'border-emerald-500/20 hover:border-emerald-500/40'
                }`}
              >
                {/* Decorative Icon */}
                <div className={`absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity`}>
                  {insight.severity === 'critical' ? <ShieldAlert size={120} /> : 
                   insight.severity === 'warning' ? <Zap size={120} /> : <CheckCircle2 size={120} />}
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                      insight.severity === 'critical' ? 'bg-red-500/20 text-red-500' :
                      insight.severity === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                      'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {insight.severity}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-foreground mb-1">{insight.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.reason}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap size={10} className="text-primary" />
                      <span className="text-[9px] font-black uppercase text-primary tracking-widest">Recommended Action</span>
                    </div>
                    <p className="text-[10px] font-bold text-foreground leading-tight">{insight.action}</p>
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <Info size={12} className="text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest block mb-1">Projected Impact</span>
                      <p className="text-[10px] text-muted-foreground/80 italic">{insight.impact}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
              <Database className="text-white/10" size={48} />
              <div>
                <p className="text-sm font-bold text-muted-foreground">AI Waiting for Live Data Feed</p>
                <p className="text-xs text-muted-foreground/60">Connect more operational tables to generate reasoning.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
