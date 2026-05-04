import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, HousingUnit } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Users, MapPin, Search, BedDouble, CheckCircle2, Trash2, Edit2, Plus, X, MoreVertical } from 'lucide-react';

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

const unitSchema = z.object({
  unitNumber: z.string().min(1, 'Unit identifier is required'),
  location: z.string().optional(),
  capacity: z.coerce.number().min(0),
  status: z.enum(['Available', 'Fully Occupied', 'Partial', 'Maintenance']),
  notes: z.string().optional(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

function EditUnitModal({ unit, onClose }: { unit: HousingUnit; onClose: () => void }) {
  const { updateHousingUnit } = useAppContext();
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      unitNumber: unit.unitNumber,
      location: unit.location || '',
      capacity: unit.capacity,
      status: unit.status as any || 'Available',
      notes: unit.notes || ''
    }
  });

  const onSubmit = (values: UnitFormValues) => {
    updateHousingUnit(unit.id, { ...values, location: values.location || '', notes: values.notes || '' });
    onClose();
  };

  const iClass = 'bg-white/5 border-white/10 text-sm';
  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Edit Unit {unit.unitNumber}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="unitNumber" render={({ field }) => (
                <FormItem><FormLabel>Unit Number / Name</FormLabel>
                  <FormControl><Input {...field} className={iClass} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Building / Location</FormLabel>
                  <FormControl><Input {...field} className={iClass} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="capacity" render={({ field }) => (
                  <FormItem><FormLabel>Capacity</FormLabel>
                    <FormControl><Input type="number" {...field} className={iClass} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Fully Occupied">Fully Occupied</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
              </div>
              <Button type="submit" className="w-full mt-4">Save Changes</Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddResidentModal({ unit, onClose }: { unit: HousingUnit; onClose: () => void }) {
  const { employees, addHousingAssignment } = useAppContext();
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.internalCode.toLowerCase().includes(search.toLowerCase())
  );

  const assign = async (emp: any) => {
    await addHousingAssignment(unit.id, emp.name, emp.internalCode);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Add Resident to {unit.unitNumber}</DialogTitle>
        </DialogHeader>
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or code..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[50vh]">
          <div className="p-2">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No staff found</div>
            ) : (
              filtered.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => assign(emp)}
                  className="w-full flex items-center justify-between p-3 hover:bg-white/5 rounded-md transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-sm text-white/90">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.role}</div>
                  </div>
                  {emp.internalCode && (
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] font-mono">
                      {emp.internalCode}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Facilities() {
  const { housingUnits, loading, deleteHousingUnit, deleteHousingAssignment, updateHousingUnit } = useAppContext();
  const [search, setSearch] = useState('');
  const [editUnit, setEditUnit] = useState<HousingUnit | null>(null);
  const [assignResident, setAssignResident] = useState<HousingUnit | null>(null);
  const [editingCapacityId, setEditingCapacityId] = useState<string | null>(null);
  const [capacityDraft, setCapacityDraft] = useState('');

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

      {editUnit && <EditUnitModal unit={editUnit} onClose={() => setEditUnit(null)} />}
      {assignResident && <AddResidentModal unit={assignResident} onClose={() => setAssignResident(null)} />}

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
            const cap = unit.capacity || 0;
            const occ = unit.occupants || 0;
            const occupancyPct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
            return (
              <Card key={unit.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center justify-between gap-2 w-full">
                        {unit.unitNumber}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-muted-foreground hover:text-white" title="Edit Unit" onClick={() => setEditUnit(unit)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button className="text-muted-foreground hover:text-red-400" title="Delete Unit" onClick={() => { if(confirm('Are you sure you want to delete this unit?')) deleteHousingUnit(unit.id); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </CardTitle>
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
                    <span className="font-medium flex items-center gap-1">
                      {occ} / 
                      {editingCapacityId === unit.id ? (
                        <input
                          type="number"
                          autoFocus
                          className="w-12 bg-white/10 border border-cyan-500/40 rounded px-1 text-xs text-white outline-none"
                          value={capacityDraft}
                          onChange={e => setCapacityDraft(e.target.value)}
                          onBlur={() => {
                            const n = parseInt(capacityDraft, 10);
                            if (!isNaN(n) && n >= 0) updateHousingUnit(unit.id, { capacity: n });
                            setEditingCapacityId(null);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') (e.target as HTMLElement).blur();
                            if (e.key === 'Escape') setEditingCapacityId(null);
                          }}
                        />
                      ) : (
                        <button
                          title="Click to edit capacity"
                          className="hover:text-cyan-400 transition-colors underline underline-offset-2 decoration-dashed"
                          onClick={() => { setEditingCapacityId(unit.id); setCapacityDraft(String(cap)); }}
                        >
                          {cap || <span className="text-amber-400">Set capacity</span>}
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${occupancyPct >= 100 ? 'bg-red-500' : occupancyPct >= 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>

                  {/* Residents section — always visible */}
                  <div className="mt-4 pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Residents ({(unit.residents || []).length})</p>
                      <button className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setAssignResident(unit)}>
                        <Plus className="h-3 w-3" /> Add
                      </button>
                    </div>
                    {(unit.residents || []).length === 0 && (
                      <button className="w-full text-xs text-muted-foreground hover:text-cyan-400 flex items-center justify-center gap-1 py-2 border border-dashed border-white/10 rounded hover:border-cyan-500/30 transition-colors" onClick={() => setAssignResident(unit)}>
                        <Plus className="h-3 w-3" /> Add first resident
                      </button>
                    )}
                    {(unit.residents || []).map((r, i) => (
                      <div key={i} className="group/res flex items-center justify-between text-sm bg-white/5 rounded px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span>{r.name}</span>
                          {r.code && (
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[9px] px-1 font-mono">
                              {r.code}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === 'pending_review' && (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] px-1 uppercase">Pending</Badge>
                          )}
                          <button className="text-muted-foreground hover:text-red-400 opacity-0 group-hover/res:opacity-100 transition-opacity" onClick={() => deleteHousingAssignment(unit.id, r.code, r.name)}>
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
