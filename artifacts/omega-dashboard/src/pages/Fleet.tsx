import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, Vehicle } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Car, Plus, Pencil, Trash2, Search, UserMinus,
  Wrench, CheckCircle2, AlertTriangle, TrendingDown, Wallet, AlertCircle
} from 'lucide-react';

const vehicleSchema = z.object({
  routeName: z.string().optional(),
  carName: z.string().min(1, 'Vehicle type/name is required'),
  plateNumber: z.string().optional(),
  driver: z.string().optional(),
  fuelCardBalance: z.coerce.number().min(0).optional(),
  lastService: z.string().optional(),
  maintenanceCost: z.coerce.number().min(0).optional(),
  status: z.enum(['Active', 'In Service', 'Out of Service']),
  notes: z.string().optional(),
  dailyRate: z.coerce.number().optional(),
  passengerCount: z.coerce.number().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const emptyDefaults: VehicleFormValues = {
  routeName: '', carName: '', plateNumber: '', driver: '',
  fuelCardBalance: 0, lastService: '', maintenanceCost: 0,
  status: 'Active', notes: '', dailyRate: 0, passengerCount: 0
};

const statusColor = (s: string) => {
  if (s === 'Active') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (s === 'In Service') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

const statusIcon = (s: string) => {
  if (s === 'Active') return <CheckCircle2 size={12} />;
  if (s === 'In Service') return <Wrench size={12} />;
  return <AlertTriangle size={12} />;
};

const fmt = (n: number) => n.toLocaleString('en-EG');

const isBadRow = (v: Vehicle): boolean => {
  const noRoute    = !v.routeName || v.routeName.trim() === '';
  const noVehicle  = !v.carName  || v.carName.trim() === '' || v.carName === 'Unknown Vehicle';
  const fakeDriver = v.driver === 'Route Driver';
  const nameAsRoute = v.routeName
    ? /[\u0600-\u06FF\s]{4,}/.test(v.routeName)
      && !v.routeName.includes('\u062e\u0637')
      && !v.routeName.startsWith('ROUTE_')
    : false;
  const noPassengers = (v.passengerCount ?? 0) === 0 && !!v.routeName;
  return noRoute || noVehicle || fakeDriver || nameAsRoute || noPassengers;
};

function VehicleFormFields({ form }: { form: any }) {
  const iClass = 'bg-white/5 border-white/10 text-sm';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="routeName" render={({ field }) => (
          <FormItem><FormLabel>Route Name / ID</FormLabel>
            <FormControl><Input {...field} className={iClass} placeholder="e.g. ROUTE_XYZ" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="carName" render={({ field }) => (
          <FormItem><FormLabel>Vehicle Type</FormLabel>
            <FormControl><Input {...field} className={iClass} placeholder="e.g. تويوتا 14 راكب" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="dailyRate" render={({ field }) => (
          <FormItem><FormLabel>Daily Rate (EGP)</FormLabel>
            <FormControl><Input type="number" {...field} className={iClass} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="passengerCount" render={({ field }) => (
          <FormItem><FormLabel>Passenger Count</FormLabel>
            <FormControl><Input type="number" {...field} className={iClass} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="plateNumber" render={({ field }) => (
          <FormItem><FormLabel>Plate Number</FormLabel>
            <FormControl><Input {...field} className={iClass} placeholder="Optional" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem><FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="In Service">In Service</SelectItem>
                <SelectItem value="Out of Service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
    </div>
  );
}

function AddModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addVehicle } = useAppContext();
  const form = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleSchema), defaultValues: emptyDefaults });

  const onSubmit = (values: VehicleFormValues) => {
    addVehicle({
      ...values,
      plateNumber: values.plateNumber || '',
      driver: values.driver || '',
      fuelCardBalance: values.fuelCardBalance || 0,
      maintenanceCost: values.maintenanceCost || 0,
      lastService: values.lastService || '',
      notes: values.notes || ''
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Add Vehicle</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <VehicleFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-add-vehicle">Add Vehicle</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const { updateVehicle } = useAppContext();
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      routeName: vehicle.routeName || '',
      carName: vehicle.carName,
      plateNumber: vehicle.plateNumber,
      driver: vehicle.driver,
      fuelCardBalance: vehicle.fuelCardBalance,
      lastService: vehicle.lastService || '',
      maintenanceCost: vehicle.maintenanceCost,
      status: vehicle.status,
      notes: vehicle.notes || '',
      dailyRate: vehicle.dailyRate || 0,
      passengerCount: vehicle.passengerCount || 0
    }
  });

  const onSubmit = (values: VehicleFormValues) => {
    updateVehicle(vehicle.id, {
      ...values,
      plateNumber: values.plateNumber || '',
      driver: values.driver || '',
      fuelCardBalance: values.fuelCardBalance || 0,
      maintenanceCost: values.maintenanceCost || 0,
      lastService: values.lastService || '',
      notes: values.notes || ''
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Edit — {vehicle.carName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <VehicleFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-save-vehicle">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function AssignDriverModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const { employees, updateVehicle } = useAppContext();
  const [search, setSearch] = useState('');
  const [assigning, setAssigning] = useState(false);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.internalCode.toLowerCase().includes(search.toLowerCase())
  );

  const assign = (emp: typeof employees[number]) => {
    if (assigning) return;
    setAssigning(true);

    const driverName = emp.name?.trim() || '';
    const driverCode = String(emp.internalCode || (emp as any).employeeCode || (emp as any).employee_code || (emp as any).code || '').trim();

    if (!driverCode) {
      console.warn(`[AssignDriver] Employee "${driverName}" has no internalCode — driver_code will be empty`);
    }

    // Pass both snake_case and camelCase variations to be absolutely certain the mapping captures them correctly
    updateVehicle(vehicle.id, {
      driver: driverName,
      driverCode: driverCode,
      driver_code: driverCode,
      assignmentStatus: 'linked',
      assignment_status: 'linked'
    } as any);

    setAssigning(false);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[400px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Assign Driver</DialogTitle>
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

function LiquidityBar() {
  const { vehicles, totalLiquidity, setTotalLiquidity } = useAppContext();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const totalMaintenance = vehicles.reduce((s, v) => s + v.maintenanceCost, 0);
  const available = totalLiquidity - totalMaintenance;
  const pct = totalLiquidity > 0 ? Math.max(0, Math.min(100, (available / totalLiquidity) * 100)) : 0;
  const barColor = pct > 60 ? 'bg-green-500' : pct > 30 ? 'bg-yellow-500' : 'bg-red-500';

  const commit = () => {
    const val = parseFloat(draft.replace(/,/g, ''));
    if (!isNaN(val) && val >= 0) setTotalLiquidity(val);
    setEditing(false);
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Finance Link — Fleet vs Liquidity</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Total Liquidity:</span>
              {editing ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    className="h-6 w-32 bg-white/5 border-white/10 text-xs px-2"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
                  />
                  <Button size="sm" className="h-6 text-xs px-2" onClick={commit}>Set</Button>
                </div>
              ) : (
                <button
                  onClick={() => { setDraft(String(totalLiquidity)); setEditing(true); }}
                  className="font-bold text-foreground hover:text-primary transition-colors underline underline-offset-2 text-sm"
                >
                  EGP {fmt(totalLiquidity)}
                </button>
              )}
            </div>
            <div className="text-xs text-red-400 flex items-center gap-1">
              <TrendingDown size={12} />
              <span>Fleet Costs: EGP {fmt(totalMaintenance)}</span>
            </div>
            <div className={`text-xs font-bold ${available >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Available: EGP {fmt(available)}
            </div>
          </div>
        </div>
        {totalLiquidity > 0 && (
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${barColor}`}
            />
          </div>
        )}
        {totalLiquidity === 0 && (
          <p className="text-xs text-muted-foreground/60">
            Click the liquidity value above to set your total available funds — fleet maintenance costs will be subtracted automatically.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Fleet() {
  const { vehicles, deleteVehicle, updateVehicle, bulkDeleteVehicles, bulkUpdateVehicles } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataTab, setDataTab] = useState<'all' | 'valid' | 'bad'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [assignVehicle, setAssignVehicle] = useState<Vehicle | null>(null);

  const removeDriver = (id: string) => {
    updateVehicle(id, { driver: '', driverCode: '', assignmentStatus: 'pending_review' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const validCount = vehicles.filter(v => !isBadRow(v)).length;
  const badCount   = vehicles.filter(isBadRow).length;

  const tabFiltered = vehicles.filter(v => {
    if (dataTab === 'valid') return !isBadRow(v);
    if (dataTab === 'bad')   return isBadRow(v);
    return true;
  });

  const filtered = tabFiltered.filter(v => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      (v.carName ?? '').toLowerCase().includes(q) ||
      (v.plateNumber ?? '').toLowerCase().includes(q) ||
      (v.driver ?? '').toLowerCase().includes(q) ||
      (v.routeName ?? '').toLowerCase().includes(q) ||
      (v.driverCode ?? '').toLowerCase().includes(q);
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(v => selectedIds.has(v.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(v => n.delete(v.id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); filtered.forEach(v => n.add(v.id)); return n; });
    }
  };

  const activeCount = vehicles.filter(v => v.status === 'Active').length;
  const inServiceCount = vehicles.filter(v => v.status === 'In Service').length;
  const outCount = vehicles.filter(v => v.status === 'Out of Service').length;
  const totalMaintenance = vehicles.reduce((s, v) => s + v.maintenanceCost, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fleet Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Vehicle registry, fuel cards, maintenance costs & liquidity impact</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search vehicles..." className="pl-9 h-8 bg-white/5 border-white/10 text-sm w-44" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter || '__all__'} onValueChange={v => setStatusFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="In Service">In Service</SelectItem>
              <SelectItem value="Out of Service">Out of Service</SelectItem>
            </SelectContent>
          </Select>
          <Button className="h-8" onClick={() => setAddOpen(true)} data-testid="button-add-vehicle-open">
            <Plus size={15} className="mr-1.5" /> Add Vehicle
          </Button>
        </div>
      </div>

      <LiquidityBar />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Vehicles', value: vehicles.length, icon: Car },
          { label: 'Active', value: activeCount, icon: CheckCircle2 },
          { label: 'In Service', value: inServiceCount, icon: Wrench },
          { label: 'Total Maintenance', value: `EGP ${fmt(totalMaintenance)}`, icon: TrendingDown, red: totalMaintenance > 0 },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border ${c.red ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <c.icon size={13} className={c.red ? 'text-red-400' : 'text-muted-foreground'} />
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
                </div>
                <p className={`text-xl font-bold ${c.red ? 'text-red-400' : 'text-foreground'}`}>{c.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Data Quality Tabs */}
      <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 w-fit">
        {(['all', 'valid', 'bad'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { setDataTab(tab); setSelectedIds(new Set()); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              dataTab === tab ? 'bg-white/15 text-white' : 'text-muted-foreground hover:text-white'
            }`}
          >
            {tab === 'bad' && <AlertCircle size={11} className="text-amber-400" />}
            {tab === 'all'   ? `All (${vehicles.length})`
             : tab === 'valid' ? `✓ Valid (${validCount})`
             : `⚠ Needs Cleanup (${badCount})`}
          </button>
        ))}
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <span className="text-xs text-amber-400 font-semibold">{selectedIds.size} row{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <div className="flex gap-2 ml-auto flex-wrap">
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 hover:bg-white/10"
              onClick={() => { bulkUpdateVehicles([...selectedIds], { assignmentStatus: 'pending_review' }); }}
            >Set Pending Review</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-white/20 hover:bg-white/10"
              onClick={() => { bulkUpdateVehicles([...selectedIds], { status: 'Out of Service' }); setSelectedIds(new Set()); }}
            >Mark Inactive</Button>
            <Button size="sm" variant="destructive" className="h-7 text-xs"
              onClick={() => { if (confirm(`Delete ${selectedIds.size} rows permanently?`)) { bulkDeleteVehicles([...selectedIds]); setSelectedIds(new Set()); } }}
            >Delete Selected</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
              onClick={() => setSelectedIds(new Set())}
            >Clear</Button>
          </div>
        </div>
      )}

      <AddModal open={addOpen} onOpenChange={setAddOpen} />
      {editVehicle && <EditModal vehicle={editVehicle} onClose={() => setEditVehicle(null)} />}
      {assignVehicle && <AssignDriverModal vehicle={assignVehicle} onClose={() => setAssignVehicle(null)} />}

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Car size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No vehicles registered</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">
            Add your first vehicle to start tracking plates, drivers, fuel card balances, and maintenance costs. All costs are automatically linked to your liquidity figure.
          </p>
          <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1.5" /> Add First Vehicle</Button>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-9">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                      className="border-white/30"
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground">Route / Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground text-right">Daily Rate</TableHead>
                  <TableHead className="text-muted-foreground text-center">Pax</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, i) => {
                  const bad = isBadRow(v);
                  const isSelected = selectedIds.has(v.id);
                  return (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`border-white/10 hover:bg-white/5 transition-colors group ${
                      isSelected ? 'bg-amber-500/5' : bad ? 'bg-red-500/3' : ''
                    }`}
                    data-testid={`row-vehicle-${v.id}`}
                  >
                    <TableCell className="w-9">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(v.id)}
                        className="border-white/30"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-md border flex items-center justify-center flex-shrink-0 ${
                            bad ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/10 border-primary/20'
                          }`}>
                            {bad ? <AlertCircle size={13} className="text-red-400" /> : <Car size={13} className="text-primary" />}
                          </div>
                          <span className="font-medium text-sm">{v.routeName || <span className="text-red-400/70 italic">No Route</span>}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{v.carName || <span className="text-red-400/70">Unknown Vehicle</span>} {v.plateNumber && `• ${v.plateNumber}`}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center">
                          {v.driver || <span className="text-muted-foreground/50">Unassigned</span>}
                          {v.driverCode && (
                            <Badge variant="outline" className="ml-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 font-mono">
                              {v.driverCode}
                            </Badge>
                          )}
                        </div>
                        {v.assignmentStatus === 'pending_review' && (
                          <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] px-1 uppercase">Pending Review</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {v.dailyRate ? fmt(v.dailyRate) : '—'}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm">
                      {v.passengerCount ? v.passengerCount : <span className="text-red-400/70">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor(v.status)} text-[10px] pointer-events-none gap-1`}>
                        {statusIcon(v.status)} {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-cyan-400" title="Assign Driver" onClick={() => setAssignVehicle(v)}>
                          <Plus size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-amber-400" title="Remove Driver" onClick={() => removeDriver(v.id)} disabled={!v.driverCode && !v.driver}>
                          <UserMinus size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" title="Edit Route" onClick={() => setEditVehicle(v)}>
                          <Pencil size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" title="Delete Route" onClick={() => deleteVehicle(v.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} row{filtered.length !== 1 ? 's' : ''} {selectedIds.size > 0 && <span className="text-amber-400 ml-1">• {selectedIds.size} selected</span>}</span>
            {dataTab === 'bad' && badCount > 0 && (
              <span className="text-red-400 font-medium flex items-center gap-1"><AlertCircle size={11} /> {badCount} rows need attention</span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
