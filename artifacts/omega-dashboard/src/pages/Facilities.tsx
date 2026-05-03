import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Building2, Users, MapPin, Search, BedDouble, CheckCircle2, AlertCircle } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusColor: Record<string, string> = {
  Available: 'bg-green-500/15 text-green-400 border-green-500/30',
  'Fully Occupied': 'bg-red-500/15 text-red-400 border-red-500/30',
  Partial: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Maintenance: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

export default function Facilities() {
  const { housingUnits, loading } = useAppContext();
  const [search, setSearch] = useState('');

  const filtered = housingUnits.filter(u =>
    u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
    u.location.toLowerCase().includes(search.toLowerCase()) ||
    u.status.toLowerCase().includes(search.toLowerCase())
  );

  const totalCapacity = housingUnits.reduce((s, u) => s + u.capacity, 0);
  const totalOccupants = housingUnits.reduce((s, u) => s + u.occupants, 0);
  const availableUnits = housingUnits.filter(u => u.status === 'Available' || u.occupants < u.capacity).length;

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facilities</h1>
          <p className="text-muted-foreground text-sm mt-1">Staff housing units and accommodation registry</p>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Units', value: housingUnits.length, icon: Building2, color: 'text-blue-400' },
          { label: 'Total Capacity', value: totalCapacity, icon: BedDouble, color: 'text-primary' },
          { label: 'Current Occupants', value: totalOccupants, icon: Users, color: 'text-green-400' },
          { label: 'Available Units', value: availableUnits, icon: CheckCircle2, color: 'text-emerald-400' },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search units..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <motion.div variants={itemVariants} className="text-center py-20 text-muted-foreground">Loading housing units...</motion.div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No housing units found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Data is pulled from the housing_units table in Supabase</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(unit => {
            const occupancyPct = unit.capacity > 0 ? Math.round((unit.occupants / unit.capacity) * 100) : 0;
            return (
              <Card key={unit.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{unit.unitNumber}</CardTitle>
                      {unit.location && (
                        <div className="flex items-center gap-1 mt-1 text-muted-foreground text-xs">
                          <MapPin className="h-3 w-3" />
                          {unit.location}
                        </div>
                      )}
                    </div>
                    <Badge className={`text-xs border ${statusColor[unit.status] ?? 'bg-white/10 text-white/70 border-white/20'}`}>
                      {unit.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Occupancy</span>
                    <span className="font-medium">{unit.occupants} / {unit.capacity}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                  {unit.residents && unit.residents.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Residents</p>
                      {unit.residents.map((r, i) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded px-2 py-1.5">
                          <div className="flex items-center gap-2">
                            <span>{r.name}</span>
                            {r.code && (
                              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[9px] px-1 font-mono">
                                {r.code}
                              </Badge>
                            )}
                          </div>
                          {r.status === 'pending_review' && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] px-1 uppercase">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {unit.notes && (
                    <p className="text-xs text-muted-foreground border-t border-white/5 pt-2">{unit.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
