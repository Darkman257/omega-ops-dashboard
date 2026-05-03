import React from 'react';
import { CloudRain, Wind, AlertTriangle, Thermometer, Droplets } from 'lucide-react';

interface WeatherRiskWidgetProps {
  siteName?: string;
  temperature?: number;
  condition?: string;
  windSpeed?: number;
  humidity?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  activeAlerts?: string[];
}

export const WeatherRiskWidget: React.FC<WeatherRiskWidgetProps> = ({
  siteName = "NEOM Sector 4",
  temperature = 42,
  condition = "Sandstorm Warning",
  windSpeed = 45,
  humidity = 12,
  riskLevel = "Critical",
  activeAlerts = ["Crane Operations Suspended", "Visibility < 50m"]
}) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'Medium': return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
      case 'High': return 'text-orange-500 border-orange-500/30 bg-orange-500/10';
      case 'Critical': return 'text-red-500 border-red-500/30 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      default: return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0A0A0A]/80 border border-white/5 backdrop-blur-xl p-6 group">
      {/* Cyberpunk Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-50"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-white/60 text-xs font-mono tracking-widest uppercase mb-1">Site Weather Guard</h3>
            <h2 className="text-xl font-bold text-white tracking-wide">{siteName}</h2>
          </div>
          <div className={`px-3 py-1 rounded-full border text-xs font-mono font-semibold flex items-center gap-1.5 ${getRiskColor(riskLevel)}`}>
            {riskLevel === 'Critical' && <AlertTriangle className="w-3 h-3 animate-pulse" />}
            {riskLevel} RISK
          </div>
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/5 w-24">
            <Thermometer className="w-8 h-8 text-cyan-400 mb-2" />
            <span className="text-3xl font-light text-white font-mono">{temperature}°</span>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <CloudRain className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-white">{condition}</p>
                <p className="text-xs text-white/50 font-mono">Current Status</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyan-400/70" />
                <span className="text-sm text-white/80 font-mono">{windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400/70" />
                <span className="text-sm text-white/80 font-mono">{humidity}%</span>
              </div>
            </div>
          </div>
        </div>

        {activeAlerts.length > 0 && (
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-mono text-white/40 uppercase tracking-wider mb-3">Active Directives</h4>
            {activeAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></div>
                <span className="text-sm text-red-200/90 font-mono">{alert}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Tech decorative elements */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      <div className="absolute top-4 right-4 w-1 h-1 bg-cyan-500 rounded-full animate-pulse"></div>
    </div>
  );
};
