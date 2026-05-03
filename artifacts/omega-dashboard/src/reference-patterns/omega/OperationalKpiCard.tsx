import React from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, Activity } from 'lucide-react';

interface OperationalKpiCardProps {
  title?: string;
  value?: string | number;
  unit?: string;
  trend?: number;
  timeframe?: string;
  dataPoints?: number[];
  color?: 'cyan' | 'emerald' | 'amber' | 'purple';
}

export const OperationalKpiCard: React.FC<OperationalKpiCardProps> = ({
  title = "Active Machinery",
  value = "142",
  unit = "Units",
  trend = +12.5,
  timeframe = "vs last shift",
  dataPoints = [30, 45, 35, 50, 49, 60, 70, 65, 80, 85, 82, 95],
  color = 'cyan'
}) => {
  const isPositive = trend >= 0;

  const getColorClasses = (c: string) => {
    switch (c) {
      case 'emerald': return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-400',
        glow: 'shadow-[0_0_15px_rgba(52,211,153,0.3)]',
        border: 'border-emerald-500/30',
        gradient: 'from-emerald-500/10'
      };
      case 'amber': return {
        text: 'text-amber-400',
        bg: 'bg-amber-400',
        glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]',
        border: 'border-amber-500/30',
        gradient: 'from-amber-500/10'
      };
      case 'purple': return {
        text: 'text-purple-400',
        bg: 'bg-purple-400',
        glow: 'shadow-[0_0_15px_rgba(192,132,252,0.3)]',
        border: 'border-purple-500/30',
        gradient: 'from-purple-500/10'
      };
      default: return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-400',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
        border: 'border-cyan-500/30',
        gradient: 'from-cyan-500/10'
      };
    }
  };

  const theme = getColorClasses(color);

  // SVG Sparkline Generation
  const maxData = Math.max(...dataPoints);
  const minData = Math.min(...dataPoints);
  const range = maxData - minData || 1;
  const svgWidth = 200;
  const svgHeight = 40;
  
  const points = dataPoints.map((dp, i) => {
    const x = (i / (dataPoints.length - 1)) * svgWidth;
    const y = svgHeight - ((dp - minData) / range) * svgHeight;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-[#0A0A0A] border ${theme.border} p-5 group transition-all hover:bg-[#0c0c0c] flex flex-col gap-4 min-w-[280px]`}>
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 ${theme.bg} opacity-[0.05] blur-3xl rounded-full transition-opacity group-hover:opacity-10`}></div>
      <div className={`absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r ${theme.gradient} via-transparent to-transparent opacity-50`}></div>

      {/* Header */}
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md bg-white/5 border border-white/10 ${theme.text}`}>
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-white/60 font-mono text-xs uppercase tracking-wider">{title}</h3>
        </div>
        <button className="text-white/30 hover:text-white/80 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Main KPI */}
      <div className="flex items-end gap-2 relative z-10">
        <span className="text-4xl font-bold text-white tracking-tight drop-shadow-md">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-white/40 font-mono mb-1">{unit}</span>
        )}
      </div>

      {/* Trend & Timeframe */}
      <div className="flex items-center gap-2 relative z-10">
        <div className={`flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full border ${isPositive ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' : 'text-red-400 bg-red-400/10 border-red-500/20'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{trend}%
        </div>
        <span className="text-xs text-white/40 font-mono">{timeframe}</span>
      </div>

      {/* Sparkline Chart */}
      <div className="mt-2 h-10 w-full relative z-10">
        <svg width="100%" height="100%" viewBox={`0 -5 ${svgWidth} ${svgHeight + 10}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`var(--tw-colors-${color}-400, #22d3ee)`} stopOpacity="0.3" />
              <stop offset="100%" stopColor={`var(--tw-colors-${color}-400, #22d3ee)`} stopOpacity="0" />
            </linearGradient>
            <filter id={`glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Area fill */}
          <polygon 
            points={`${points} ${svgWidth},${svgHeight} 0,${svgHeight}`} 
            fill={`url(#gradient-${color})`} 
          />
          
          {/* Line */}
          <polyline 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className={`${theme.text}`}
            points={points} 
            filter={`url(#glow-${color})`}
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Latest Data Point Dot */}
          {(() => {
            const lastY = svgHeight - ((dataPoints[dataPoints.length - 1] - minData) / range) * svgHeight;
            return (
              <circle 
                cx={svgWidth} 
                cy={lastY} 
                r="3" 
                className={`${theme.bg} fill-current shadow-[0_0_10px_currentColor]`}
                filter={`url(#glow-${color})`}
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
};
