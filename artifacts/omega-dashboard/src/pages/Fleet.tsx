import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, Vehicle } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Car, Plus, Pencil, Trash2, Search,
  Fuel, Wrench, CheckCircle2, AlertTriangle, TrendingDown, Wallet
} from 'lucide-react';

const vehicleSchema = z.object({
  carName: z.string().min(1, 'Car name is required'),
  plateNumber: z.string().min(1, 'Plate number is required'),
  driver: z.string().min(1, 'Driver name is required'),
  fuelCardBalance: z.coerce.number().min(0),
  lastService: z.string().optional(),
  maintenanceCost: z.coerce.number().min(0),
  status: z.enum(['Active', 'In Service', 'Out of Service']),
  notes: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const emptyDefaults: VehicleFormValues = {
  carName: '', plateNumber: '', driver: '',
  fuelCardBalance: 0, lastService: '', maintenanceCost: 0,
  status: 'Active', notes: ''
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

function VehicleFormFields({ form }: { form: any }) {
  const iClass = 'bg-white/5 border-white/10 text-sm';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="carName" render={({ field }) => (
          <FormItem><FormLabel>Car Name / Model</FormLabel>
            <FormControl><Input {...field} className={iClass} placeholder="e.g. Toyota Hilux" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="plateNumber" render={({ field }) => (
          <FormItem><FormLabel>Plate Number</FormLabel>
            <FormControl><Input {...field} className={iClass} placeholder="e.g. 123 أ ب ج" /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="driver" render={({ field }) => (
          <FormItem><FormLabel>Assigned Driver</FormLabel>
            <FormControl><Input {...field} className={iClass} /></FormControl>
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
      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Finance & Maintenance (EGP)</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="fuelCardBalance" render={({ field }) => (
            <FormItem><FormLabel>Fuel Card Balance</FormLabel>
              <FormControl><Input type="number" {...field} className={iClass} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="maintenanceCost" render={({ field }) => (
            <FormItem><FormLabel>Maintenance Cost</FormLabel>
              <FormControl><Input type="number" {...field} className={iClass} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="mt-3">
          <FormField control={form.control} name="lastService" render={({ field }) => (
            <FormItem><FormLabel>Last Service Date</FormLabel>
              <FormControl><Input type="date" {...field} className={iClass} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>
      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem><FormLabel>Notes</FormLabel>
          <FormControl><Input {...field} className={iClass} placeholder="Optional notes" /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </div>
  );
}

function AddModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addVehicle } = useAppContext();
  const form = useForm<VehicleFormValues>({ resolver: zodResolver(vehicleSchema), defaultValues: emptyDefaults });

  const onSubmit = (values: VehicleFormValues) => {
    addVehicle({ ...values, lastService: values.lastService || '', notes: values.notes || '' });
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
      carName: vehicle.carName,
      plateNumber: vehicle.plateNumber,
      driver: vehicle.driver,
      fuelCardBalance: vehicle.fuelCardBalance,
      lastService: vehicle.lastService || '',
      maintenanceCost: vehicle.maintenanceCost,
      status: vehicle.status,
      notes: vehicle.notes || ''
    }
  });

  const onSubmit = (values: VehicleFormValues) => {
    updateVehicle(vehicle.id, { ...values, lastService: values.lastService || '', notes: values.notes || '' });
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
  const { vehicles, deleteVehicle } = useAppContext();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  const filtered = vehicles.filter(v => {
    const matchesSearch = !search ||
      v.carName.toLowerCase().includes(search.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(search.toLowerCase()) ||
      v.driver.toLowerCase().includes(search.toLowerCase()) ||
      (v.driverCode ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

      <AddModal open={addOpen} onOpenChange={setAddOpen} />
      {editVehicle && <EditModal vehicle={editVehicle} onClose={() => setEditVehicle(null)} />}

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
                  <TableHead className="text-muted-foreground">Vehicle</TableHead>
                  <TableHead className="text-muted-foreground">Plate No.</TableHead>
                  <TableHead className="text-muted-foreground">Driver</TableHead>
                  <TableHead className="text-muted-foreground text-right">Fuel Card</TableHead>
                  <TableHead className="text-muted-foreground">Last Service</TableHead>
                  <TableHead className="text-muted-foreground text-right text-red-400">Maint. Cost</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((v, i) => (
                  <motion.tr
                    key={v.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-white/10 hover:bg-white/5 transition-colors group"
                    data-testid={`row-vehicle-${v.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <Car size={13} className="text-primary" />
                        </div>
                        <span className="font-medium text-sm">{v.carName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm bg-white/10 px-2 py-0.5 rounded">{v.plateNumber}</span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.driver}
                      {v.driverCode && (
                        <Badge variant="outline" className="ml-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-[10px] px-1.5 font-mono">
                          {v.driverCode}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <Fuel size={11} className="text-yellow-400" />
                        <span>{fmt(v.fuelCardBalance)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {v.lastService || <span className="text-muted-foreground/40">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {v.maintenanceCost > 0
                        ? <span className="text-red-400">({fmt(v.maintenanceCost)})</span>
                        : <span className="text-muted-foreground/40">—</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColor(v.status)} text-[10px] pointer-events-none gap-1`}>
                        {statusIcon(v.status)} {v.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditVehicle(v)}>
                          <Pencil size={12} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteVehicle(v.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-red-400 font-medium">Total Maintenance: EGP {fmt(totalMaintenance)}</span>
          </div>
        </Card>
      )}
    </div>
  );
}
