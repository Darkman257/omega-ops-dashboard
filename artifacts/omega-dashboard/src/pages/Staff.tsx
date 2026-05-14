import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext, Employee } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search, Pencil, Trash2, LogOut, ShieldCheck, XCircle, AlertTriangle, Clock, Calendar, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { normalizeSearchText, matchesSearch } from '@/lib/searchUtils';
import { EmployeeClearanceModal } from '@/components/EmployeeClearanceModal';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.string().min(1, 'Role is required'),
  department: z.string().min(1, 'Department is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').or(z.literal('')),
  status: z.enum(['Active', 'Inactive']),
  passportExpiry: z.string().optional(),
  insuranceStatus: z.enum(['Valid', 'Expired', 'Not Set']),
  basicSalary: z.coerce.number().min(0),
  siteAllowance: z.coerce.number().min(0),
  currentSite: z.string().optional(),
  hireDate: z.string().optional()
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const defaultValues: EmployeeFormValues = {
  name: '',
  role: '',
  department: '',
  phone: '',
  email: '',
  status: 'Active',
  passportExpiry: '',
  insuranceStatus: 'Not Set',
  basicSalary: 0,
  siteAllowance: 0,
  currentSite: '',
  hireDate: ''
};

function EmployeeFormFields({ form }: { form: any }) {
  return (
    <div className="space-y-6">
      {/* Section 1: Identity */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 flex items-center gap-1.5 px-0.5">
          <span className="w-1 h-3 bg-cyan-500/30 rounded-full block"></span> Identity
        </h4>
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Full Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9" /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Role / Title</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="department" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Department</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>

      {/* Section 2: Operations */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 flex items-center gap-1.5 px-0.5">
          <span className="w-1 h-3 bg-cyan-500/30 rounded-full block"></span> Operations
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Phone</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9 font-mono" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Email</FormLabel><FormControl><Input type="email" {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground/80">Employment Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="hireDate" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Hire Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9 font-mono text-left" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="currentSite" render={({ field }) => (
          <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Assigned Project / Site</FormLabel><FormControl><Input {...field} placeholder="e.g., Obsidier Tower, HQ" className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9" /></FormControl><FormMessage /></FormItem>
        )} />
      </div>

      {/* Section 3: HR & Compliance */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 flex items-center gap-1.5 px-0.5">
          <span className="w-1 h-3 bg-cyan-500/30 rounded-full block"></span> HR & Compliance
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="passportExpiry" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Passport / ID Expiry</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9 font-mono text-left" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="insuranceStatus" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-muted-foreground/80">Insurance Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="Valid">Valid</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Not Set">Not Set</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
      </div>

      {/* Section 4: Compensation */}
      <div className="space-y-3 pt-2 border-t border-white/5">
        <h4 className="text-[10px] uppercase tracking-widest font-bold text-cyan-500 flex items-center gap-1.5 px-0.5">
          <span className="w-1 h-3 bg-cyan-500/30 rounded-full block"></span> Compensation
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <FormField control={form.control} name="basicSalary" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Basic Salary (EGP)</FormLabel><FormControl><Input type="number" {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9 font-mono" /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="siteAllowance" render={({ field }) => (
            <FormItem><FormLabel className="text-xs font-medium text-muted-foreground/80">Site Allowance (EGP)</FormLabel><FormControl><Input type="number" {...field} className="bg-white/5 border-white/10 focus:border-cyan-500/50 h-9 font-mono" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}

function AddEmployeeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addEmployee } = useAppContext();
  const form = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues });

  const onSubmit = (values: EmployeeFormValues) => {
    addEmployee({ 
      ...values, 
      passportExpiry: values.passportExpiry || '', 
      currentSite: values.currentSite || '',
      hireDate: values.hireDate || '',
      internalCode: (values as any).internalCode || '',
      lifecycleStatus: 'active',
      clearanceStatus: 'not_required'
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold">Add New Employee</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <EmployeeFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-add-employee">Add Employee</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditEmployeeModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const { updateEmployee } = useAppContext();
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: employee.name,
      role: employee.role,
      department: employee.department,
      phone: employee.phone,
      email: employee.email,
      status: employee.status,
      passportExpiry: employee.passportExpiry || '',
      insuranceStatus: employee.insuranceStatus || 'Not Set',
      basicSalary: employee.basicSalary || 0,
      siteAllowance: employee.siteAllowance || 0,
      currentSite: employee.currentSite || '',
      hireDate: employee.hireDate || ''
    }
  });

  const onSubmit = (values: EmployeeFormValues) => {
    updateEmployee(employee.id, { 
      ...values, 
      passportExpiry: values.passportExpiry || '',
      currentSite: values.currentSite || '',
      hireDate: values.hireDate || '',
      internalCode: (values as any).internalCode || employee.internalCode || ''
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold">Edit Employee — {employee.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[72vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <EmployeeFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-save-employee">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function StartOffboardingModal({ employee, open, onClose }: { employee: Employee; open: boolean; onClose: () => void }) {
  const { startEmployeeOffboarding } = useAppContext();
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!reason) return;
    await startEmployeeOffboarding(employee.id, reason, notes);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[450px] bg-[#0A0A0A] border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogOut className="text-red-500" size={18} />
            Start Offboarding
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Collect exit details for {employee.name}</p>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Exit Reason</label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Resignation">Resignation</SelectItem>
                <SelectItem value="Termination">Termination</SelectItem>
                <SelectItem value="End of Contract">End of Contract</SelectItem>
                <SelectItem value="Retirement">Retirement</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notes</label>
            <Textarea 
              placeholder="Internal notes regarding this exit..."
              className="bg-white/5 border-white/10 min-h-[100px] resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-500 text-white font-bold" onClick={handleSubmit} disabled={!reason}>
            Confirm & Start Clearance
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Staff() {
  const [, navigate] = useLocation();
  const { employees, deleteEmployee, cancelEmployeeOffboarding, siteFilter, loading } = useAppContext();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [offboardingEmployee, setOffboardingEmployee] = useState<Employee | null>(null);
  const [clearanceEmployee, setClearanceEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(e => {
    const matchesSearchText = matchesSearch(search, e.name, e.department, e.role, e.internalCode);
    const matchesSite = !siteFilter || e.currentSite === siteFilter;
    return matchesSearchText && matchesSite;
  });

  const getInsuranceColor = (status: string) => {
    if (status === 'Valid') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (status === 'Expired') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Directory</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, role, or code..." className="pl-9 bg-white/5 border-white/10 text-sm h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="h-9" onClick={() => setAddOpen(true)} data-testid="button-open-add-employee">
            <Plus size={16} className="mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      <AddEmployeeModal open={addOpen} onOpenChange={setAddOpen} />
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}
      {offboardingEmployee && (
        <StartOffboardingModal 
          employee={offboardingEmployee} 
          open={!!offboardingEmployee} 
          onClose={() => setOffboardingEmployee(null)} 
        />
      )}
      {clearanceEmployee && (
        <EmployeeClearanceModal 
          employee={clearanceEmployee} 
          isOpen={!!clearanceEmployee} 
          onClose={() => setClearanceEmployee(null)} 
        />
      )}

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"><Users size={32} className="text-primary" /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No staff records found. Add employees manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} className="mr-2" /> Add Employee</Button>
        </div>
      ) : (
        <Card className="bg-transparent border-none shadow-none overflow-hidden">
          <Table className="border-separate border-spacing-y-2 px-1">
            <TableHeader className="bg-transparent">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="text-muted-foreground/60 text-[10px] uppercase tracking-widest font-black pl-6 border-none">Personnel Profile</TableHead>
                <TableHead className="text-muted-foreground/60 text-[10px] uppercase tracking-widest font-black border-none">Operational Channels</TableHead>
                <TableHead className="text-muted-foreground/60 text-[10px] uppercase tracking-widest font-black border-none">Status & Compliance</TableHead>
                <TableHead className="text-muted-foreground/60 text-[10px] uppercase tracking-widest font-black border-none text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="group cursor-pointer hover:bg-transparent relative"
                  data-testid={`row-staff-${emp.id}`}
                  onClick={() => navigate(`/staff/${emp.id}`)}
                >
                  {/* 1. PERSONNEL PROFILE CELL */}
                  <TableCell className="bg-white/[0.02] group-hover:bg-white/[0.04] border-y border-white/[0.04] first:border-l first:rounded-l-xl transition-colors py-3 pl-5 relative border-collapse border-none">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-11 w-11 border border-cyan-500/15 ring-2 ring-cyan-500/5 group-hover:border-cyan-500/30 group-hover:ring-cyan-500/10 transition-all shrink-0">
                        <AvatarFallback className="bg-cyan-500/5 text-cyan-400 font-black text-xs">
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-white tracking-wide hover:text-cyan-400 transition-colors truncate block max-w-[250px]" dir="rtl">
                            {emp.name}
                          </span>
                          {emp.internalCode && (
                            <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-mono font-bold px-1.5 py-0">
                              {emp.internalCode}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                          <span className="font-medium text-foreground/80">{emp.role}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-muted-foreground/60 text-[11px]">{emp.department}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* 2. OPERATIONAL CHANNELS CELL */}
                  <TableCell className="bg-white/[0.02] group-hover:bg-white/[0.04] border-y border-white/[0.04] transition-colors py-3 border-none">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {emp.phone ? (
                          <a 
                            href={`tel:${emp.phone}`} 
                            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-all font-mono bg-cyan-500/5 border border-cyan-500/10 rounded px-2 py-0.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <Phone size={11} className="text-cyan-500" /> {emp.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/30 text-xs font-mono pl-2">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {emp.currentSite ? (
                          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-[10px] px-2 py-0 font-medium flex items-center gap-1">
                            <MapPin size={10} /> Site: {emp.currentSite}
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/30 px-2">Site: —</span>
                        )}
                        {emp.hireDate && (
                          <div className="text-[10px] text-muted-foreground/60 flex items-center gap-1 font-mono">
                            <Calendar size={10} className="text-muted-foreground/40" /> Joined: {emp.hireDate}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 3. STATUS & COMPLIANCE CELL */}
                  <TableCell className="bg-white/[0.02] group-hover:bg-white/[0.04] border-y border-white/[0.04] transition-colors py-3 border-none">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-wider px-2 border ${
                          emp.lifecycleStatus === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/25' :
                          emp.lifecycleStatus === 'offboarding' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                          'bg-red-500/10 text-red-400 border-red-500/25'
                        }`}>
                          {emp.lifecycleStatus}
                        </Badge>
                        {emp.clearanceStatus !== 'not_required' && (
                          <Badge variant="outline" className={`text-[9px] uppercase tracking-widest px-1.5 py-0 flex items-center gap-0.5 font-medium border shrink-0 ${
                            emp.clearanceStatus === 'cleared' ? 'bg-green-500/5 text-green-400 border-green-500/15' :
                            emp.clearanceStatus === 'blocked' ? 'bg-red-500/5 text-red-400 border-red-500/15' :
                            'bg-blue-500/5 text-blue-300 border-blue-500/15'
                          }`}>
                            {emp.clearanceStatus === 'cleared' ? <ShieldCheck size={9} /> : 
                             emp.clearanceStatus === 'blocked' ? <AlertTriangle size={9} /> : <Clock size={9} />}
                            {emp.clearanceStatus}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span className={`font-medium ${
                          emp.insuranceStatus === 'Valid' ? 'text-green-400/70' :
                          emp.insuranceStatus === 'Expired' ? 'text-red-400/70' : 'text-muted-foreground/40'
                        }`}>
                          Ins: {emp.insuranceStatus}
                        </span>
                        {(emp.basicSalary || 0) > 0 && (
                          <>
                            <span className="text-muted-foreground/20">•</span>
                            <span className="text-muted-foreground/50 font-mono font-medium text-[9px]">
                              {emp.basicSalary?.toLocaleString()} EGP
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* 4. CONTROL CENTER CELL */}
                  <TableCell className="bg-white/[0.02] group-hover:bg-white/[0.04] border-y border-white/[0.04] last:border-r last:rounded-r-xl transition-colors py-3 pr-5 text-right border-none">
                    <div className="flex justify-end items-center gap-1.5">
                      {emp.lifecycleStatus === 'active' && (
                        <Button
                          variant="outline" size="sm"
                          className="h-8 text-[10px] font-black uppercase tracking-widest bg-red-500/5 hover:bg-red-500/15 text-red-400 border-red-500/15 hover:border-red-500/40 hover:text-red-300 transition-all shrink-0"
                          onClick={(e) => { e.stopPropagation(); setOffboardingEmployee(emp); }}
                        >
                          <LogOut size={12} className="mr-1" /> Exit
                        </Button>
                      )}
                      {emp.lifecycleStatus === 'offboarding' && (
                        <>
                          <Button
                            variant="outline" size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest bg-blue-500/5 hover:bg-blue-500/15 text-blue-400 border-blue-500/15 hover:border-blue-500/40 hover:text-blue-300 transition-all shrink-0"
                            onClick={(e) => { e.stopPropagation(); setClearanceEmployee(emp); }}
                          >
                            <ShieldCheck size={12} className="mr-1" /> Clearance
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                            onClick={(e) => { e.stopPropagation(); cancelEmployeeOffboarding(emp.id); }}
                            title="Cancel Exit"
                          >
                            <XCircle size={14} />
                          </Button>
                        </>
                      )}
                      <div className="h-6 w-px bg-white/5 mx-0.5 shrink-0" />
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground/60 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all shrink-0"
                        onClick={(e) => { e.stopPropagation(); setEditEmployee(emp); }}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground/30 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all shrink-0"
                        onClick={(e) => { e.stopPropagation(); deleteEmployee(emp.id); }}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
