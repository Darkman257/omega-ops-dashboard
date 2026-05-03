import React from 'react';
import { Activity, ShieldAlert, Video, Zap, Radio, CheckCircle2 } from 'lucide-react';

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'resolved';

export interface FeedEvent {
  id: string;
  timestamp: string;
  message: string;
  source: string;
  severity: AlertSeverity;
  type: 'sensor' | 'camera' | 'system' | 'personnel';
}

interface RealtimeOpsFeedProps {
  events?: FeedEvent[];
  title?: string;
}

const defaultEvents: FeedEvent[] = [
  { id: 'EV-001', timestamp: '10:42:05', message: 'Unauthorized access detected at Perimeter Gate 3', source: 'Cam-N-04', severity: 'critical', type: 'camera' },
  { id: 'EV-002', timestamp: '10:38:12', message: 'Excavator 5 fuel level below 15%', source: 'Telematics-IoT', severity: 'warning', type: 'sensor' },
  { id: 'EV-003', timestamp: '10:30:00', message: 'Shift B successfully clocked in (142/145 present)', source: 'Bio-Gate-1', severity: 'info', type: 'personnel' },
  { id: 'EV-004', timestamp: '10:15:22', message: 'Thermal anomaly resolved in Server Room B', source: 'Temp-Sensor-09', severity: 'resolved', type: 'system' },
  { id: 'EV-005', timestamp: '09:55:10', message: 'High wind speed (45km/h) recorded. Crane ops warning.', source: 'Weather-Station-Alpha', severity: 'warning', type: 'sensor' },
];

export const RealtimeOpsFeed: React.FC<RealtimeOpsFeedProps> = ({
  events = defaultEvents,
  title = "Live Operations Stream"
}) => {
  
  const getIcon = (type: string, severity: string) => {
    const baseClass = "w-4 h-4";
    switch (type) {
      case 'camera': return <Video className={`${baseClass}`} />;
      case 'sensor': return <Radio className={`${baseClass}`} />;
      case 'system': return <Zap className={`${baseClass}`} />;
      case 'personnel': return <Activity className={`${baseClass}`} />;
      default: return <Activity className={`${baseClass}`} />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'critical': return 'text-red-400 bg-red-400/10 border-red-500/30';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-500/30';
      case 'resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30';
      default: return 'text-cyan-400 bg-cyan-400/10 border-cyan-500/30';
    }
  };

  const getSeverityGlow = (severity: string) => {
    switch(severity) {
      case 'critical': return 'shadow-[0_0_10px_rgba(248,113,113,0.5)] bg-red-500';
      case 'warning': return 'shadow-[0_0_8px_rgba(251,191,36,0.4)] bg-amber-400';
      case 'resolved': return 'shadow-[0_0_8px_rgba(52,211,153,0.4)] bg-emerald-400';
      default: return 'shadow-[0_0_8px_rgba(34,211,238,0.4)] bg-cyan-400';
    }
  }

  return (
    <div className="relative flex flex-col h-[400px] overflow-hidden rounded-2xl bg-[#0A0A0A]/90 border border-white/10 backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-3 h-3 bg-cyan-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-2 h-2 bg-cyan-400 rounded-full"></div>
          </div>
          <h2 className="text-white/90 font-mono font-semibold tracking-wide uppercase text-sm">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-cyan-400/60 uppercase border border-cyan-500/20 px-2 py-0.5 rounded-full bg-cyan-500/5">
            Auto-Sync
          </span>
        </div>
      </div>

      {/* Feed Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {events.map((evt, idx) => (
          <div key={evt.id} className="relative group pl-6">
            {/* Timeline Line */}
            {idx !== events.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-24px] w-[1px] bg-white/5 group-hover:bg-white/10 transition-colors"></div>
            )}
            
            {/* Timeline Node */}
            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-[#0A0A0A] border ${getSeverityStyles(evt.severity).split(' ')[2]}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${getSeverityGlow(evt.severity)}`}></div>
            </div>

            {/* Event Card */}
            <div className={`p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-white/10 flex flex-col gap-2 ${evt.severity === 'critical' ? 'hover:border-red-500/30' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-white/40">{evt.timestamp}</span>
                  <span className="text-[10px] font-mono text-white/30 px-1.5 py-0.5 rounded bg-white/5">
                    {evt.source}
                  </span>
                </div>
                {evt.severity === 'resolved' ? (
                   <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : evt.severity === 'critical' ? (
                   <ShieldAlert className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                ) : null}
              </div>
              
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded-lg ${getSeverityStyles(evt.severity)}`}>
                  {getIcon(evt.type, evt.severity)}
                </div>
                <p className="text-sm text-white/80 leading-snug">
                  {evt.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Ambient Bottom Gradient to imply scrolling */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0A0A0A] to-transparent pointer-events-none"></div>
      
      {/* Scoped CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.5);
        }
      `}</style>
    </div>
  );
};
