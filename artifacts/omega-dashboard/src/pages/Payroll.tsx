import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, PayrollRecord } from '@/context/AppContext';
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
import { useLocation } from 'wouter';
import * as z from 'zod';
import {
  Banknote, Plus, Search, Pencil, Trash2,
  Upload, TrendingUp, Users, CheckCircle2, Clock, MapPin
} from 'lucide-react';

const payrollSchema = z.object({
  employeeName: z.string().min(1, 'Name is required'),
  role: z.string().optional(),
  department: z.string().optional(),
  siteName: z.string().optional(),
  month: z.string().min(1, 'Month is required'),
  basicSalary: z.coerce.number().min(0),
  siteAllowance: z.coerce.number().min(0),
  overtimePay: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  status: z.enum(['Paid', 'Pending', 'On Hold']),
  internalCode: z.string().optional(),
  notes: z.string().optional(),
});

type PayrollFormValues = z.infer<typeof payrollSchema>;

const emptyDefaults: PayrollFormValues = {
  employeeName: '', role: '', department: '', siteName: '',
  month: new Date().toISOString().substring(0, 7),
  basicSalary: 0, siteAllowance: 0, overtimePay: 0, deductions: 0,
  status: 'Pending', internalCode: '', notes: ''
};

const statusColor = (s: string) => {
  if (s === 'Paid') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (s === 'Pending') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
};

const fmt = (n: number) => n.toLocaleString('en-EG');

function NetSalaryPreview({ values }: { values: Partial<PayrollFormValues> }) {
  const net = (Number(values.basicSalary) || 0)
    + (Number(values.siteAllowance) || 0)
    + (Number(values.overtimePay) || 0)
    - (Number(values.deductions) || 0);
  return (
    <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 flex items-center justify-between">
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Salary (Calculated)</span>
      <span className="text-lg font-bold text-primary">EGP {fmt(Math.max(0, net))}</span>
    </div>
  );
}

function PayrollFormFields({ form }: { form: any }) {
  const iClass = "bg-white/5 border-white/10 text-sm";
  const values = form.watch();
  const { projects } = useAppContext();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="employeeName" render={({ field }) => (
          <FormItem><FormLabel>Employee Name</FormLabel><FormControl><Input {...field} className={iClass} placeholder="Full name" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem><FormLabel>Role / Title</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="department" render={({ field }) => (
          <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="siteName" render={({ field }) => (
          <FormItem>
            <FormLabel>Site / Project</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl><SelectTrigger className={iClass}><SelectValue placeholder="Select site" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="">— No site —</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="month" render={({ field }) => (
          <FormItem><FormLabel>Month</FormLabel><FormControl><Input type="month" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Payment Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>

      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">Compensation Breakdown (EGP)</p>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="basicSalary" render={({ field }) => (
            <FormItem><FormLabel>Basic Salary</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="siteAllowance" render={({ field }) => (
            <FormItem><FormLabel>Site Allowance</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <FormField control={form.control} name="overtimePay" render={({ field }) => (
            <FormItem><FormLabel>Overtime Pay</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="deductions" render={({ field }) => (
            <FormItem><FormLabel>Deductions</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>

      <NetSalaryPreview values={values} />

      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem><FormLabel>Notes</FormLabel><FormControl><Input {...field} className={iClass} placeholder="Optional notes" /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );
}

function AddModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addPayrollRecord } = useAppContext();
  const form = useForm<PayrollFormValues>({ resolver: zodResolver(payrollSchema), defaultValues: emptyDefaults });

  const onSubmit = (values: PayrollFormValues) => {
    const net = values.basicSalary + values.siteAllowance + values.overtimePay - values.deductions;
    addPayrollRecord({ 
      ...values, 
      netSalary: Math.max(0, net), 
      role: values.role || '', 
      department: values.department || '', 
      siteName: values.siteName || '', 
      notes: values.notes || '',
      internalCode: values.internalCode || ''
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Add Payroll Record</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <PayrollFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-add-payroll">Add Record</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({ record, onClose }: { record: PayrollRecord; onClose: () => void }) {
  const { updatePayrollRecord } = useAppContext();
  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      employeeName: record.employeeName,
      role: record.role || '',
      department: record.department || '',
      siteName: record.siteName || '',
      month: record.month,
      basicSalary: record.basicSalary,
      siteAllowance: record.siteAllowance,
      overtimePay: record.overtimePay,
      deductions: record.deductions,
      status: record.status,
      internalCode: record.internalCode || '',
      notes: record.notes || ''
    }
  });

  const onSubmit = (values: PayrollFormValues) => {
    const net = values.basicSalary + values.siteAllowance + values.overtimePay - values.deductions;
    updatePayrollRecord(record.id, { 
      ...values, 
      netSalary: Math.max(0, net), 
      role: values.role || '', 
      department: values.department || '', 
      siteName: values.siteName || '', 
      notes: values.notes || '',
      internalCode: values.internalCode || ''
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Edit Payroll — {record.employeeName}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <PayrollFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-save-payroll">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Payroll() {
  const { payrollRecords, employees, deletePayrollRecord, siteFilter } = useAppContext();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<PayrollRecord | null>(null);

  const filtered = payrollRecords.filter(r => {
    const matchesSearch = !search ||
      r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase()) ||
      r.siteName.toLowerCase().includes(search.toLowerCase());
    const matchesSite = !siteFilter || r.siteName === siteFilter;
    const matchesMonth = !monthFilter || r.month === monthFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesSite && matchesMonth && matchesStatus;
  });

  const totals = filtered.reduce((acc, r) => ({
    basic: acc.basic + r.basicSalary,
    allowance: acc.allowance + r.siteAllowance,
    overtime: acc.overtime + r.overtimePay,
    deductions: acc.deductions + r.deductions,
    net: acc.net + r.netSalary,
  }), { basic: 0, allowance: 0, overtime: 0, deductions: 0, net: 0 });

  const paidCount = filtered.filter(r => r.status === 'Paid').length;
  const pendingCount = filtered.filter(r => r.status === 'Pending').length;

  // Get unique departments for filter
  const departments = Array.from(new Set(payrollRecords.map(r => r.department).filter(Boolean)));
  const [deptFilter, setDeptFilter] = useState('');

  const finalFiltered = filtered.filter(r => !deptFilter || r.department === deptFilter);

  const iClass = "h-8 bg-white/5 border-white/10 text-sm";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll & Attendance</h1>
          {siteFilter && (
            <p className="text-sm text-primary mt-0.5">Filtered: {siteFilter}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className={`pl-9 ${iClass} w-44`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className={`${iClass} w-36`} />
          <Select value={deptFilter || '__all__'} onValueChange={v => setDeptFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className={`${iClass} w-32`}><SelectValue placeholder="Dept" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Depts</SelectItem>
              {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter || '__all__'} onValueChange={v => setStatusFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className={`${iClass} w-32`}><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 border-white/10 bg-white/5 gap-1.5" onClick={() => navigate('/import')}>
            <Upload size={14} /> Import
          </Button>
          <Button className="h-8" onClick={() => setAddOpen(true)} data-testid="button-add-payroll-open">
            <Plus size={15} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Net', value: fmt(Math.round(totals.net)), icon: TrendingUp, gold: true },
          { label: 'Basic Salary', value: fmt(Math.round(totals.basic)), icon: Banknote },
          { label: 'Allowances', value: fmt(Math.round(totals.allowance)), icon: MapPin },
          { label: 'Overtime', value: fmt(Math.round(totals.overtime)), icon: Clock },
          { label: 'Deductions', value: fmt(Math.round(totals.deductions)), icon: Trash2, red: true },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={`border ${c.gold ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <c.icon size={13} className={c.gold ? 'text-primary' : c.red ? 'text-red-400' : 'text-muted-foreground'} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{c.label}</p>
                </div>
                <p className={`text-lg font-bold ${c.gold ? 'text-primary' : c.red ? 'text-red-400' : 'text-foreground'}`}>
                  {c.value} <span className="text-[10px] font-normal opacity-50">EGP</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <AddModal open={addOpen} onOpenChange={setAddOpen} />
      {editRecord && <EditModal record={editRecord} onClose={() => setEditRecord(null)} />}

      {payrollRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Banknote size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No payroll records</h2>
          <p className="text-muted-foreground mb-6 max-w-[420px]">
            This table is ready to absorb data. Add records manually or upload your payroll Excel file via the Smart Importer. Fields: Employee, Site, Basic Salary, Allowance, Overtime, Deductions — Net Salary is calculated automatically.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1.5" /> Add Record</Button>
            <Button variant="outline" className="border-white/10 bg-white/5" onClick={() => navigate('/import')}>
              <Upload size={15} className="mr-1.5" /> Import Excel
            </Button>
          </div>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-muted-foreground">Code</TableHead>
                  <TableHead className="text-muted-foreground">Site</TableHead>
                  <TableHead className="text-muted-foreground">Month</TableHead>
                  <TableHead className="text-muted-foreground text-right font-semibold text-primary">Net Salary</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Integrity</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalFiltered.map((r, i) => {
                  const net = r.basicSalary + r.siteAllowance + r.overtimePay - r.deductions;
                  const hasCode = !!r.internalCode;
                  const isGhost = hasCode && !employees.some(e => e.internalCode === r.internalCode);
                  
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-white/10 hover:bg-white/5 transition-colors group ${!hasCode || isGhost ? 'bg-red-500/5' : ''}`}
                      data-testid={`row-payroll-${r.id}`}
                    >
                      <TableCell>
                        <div className="font-medium text-sm">{r.employeeName}</div>
                        {r.role && <div className="text-xs text-muted-foreground">{r.role}</div>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-mono ${!hasCode ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {r.internalCode || 'MISSING'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {r.siteName
                          ? <span className="text-xs bg-white/10 px-2 py-0.5 rounded-md text-foreground">{r.siteName}</span>
                          : <span className="text-muted-foreground/40 text-xs">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.month}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary">{fmt(Math.max(0, net))}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">EGP</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColor(r.status)} text-[10px] pointer-events-none`}>{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {!hasCode ? (
                          <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-500">No Identity</Badge>
                        ) : isGhost ? (
                          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">Unlinked</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-500">Verified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditRecord(r)}>
                            <Pencil size={12} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deletePayrollRecord(r.id)}>
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {finalFiltered.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs text-muted-foreground">
              <span>{finalFiltered.length} record{finalFiltered.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold text-primary">Total Net: EGP {fmt(Math.round(totals.net))}</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
