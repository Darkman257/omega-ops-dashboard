import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, Employee } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  siteAllowance: z.coerce.number().min(0)
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
  siteAllowance: 0
};

function EmployeeFormFields({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem><FormLabel>Role / Title</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="department" render={({ field }) => (
          <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="status" render={({ field }) => (
        <FormItem>
          <FormLabel>Employment Status</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )} />

      <div className="pt-2 border-t border-white/10">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 font-medium">HR & Compliance</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="passportExpiry" render={({ field }) => (
              <FormItem><FormLabel>Passport / ID Expiry</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="insuranceStatus" render={({ field }) => (
              <FormItem>
                <FormLabel>Insurance Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger></FormControl>
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
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="basicSalary" render={({ field }) => (
              <FormItem><FormLabel>Basic Salary (EGP)</FormLabel><FormControl><Input type="number" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="siteAllowance" render={({ field }) => (
              <FormItem><FormLabel>Site Allowance (EGP)</FormLabel><FormControl><Input type="number" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEmployeeModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addEmployee } = useAppContext();
  const form = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues });

  const onSubmit = (values: EmployeeFormValues) => {
    addEmployee({ ...values, passportExpiry: values.passportExpiry || '', currentSite: (values as any).currentSite || '' });
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
      siteAllowance: employee.siteAllowance || 0
    }
  });

  const onSubmit = (values: EmployeeFormValues) => {
    updateEmployee(employee.id, { ...values, passportExpiry: values.passportExpiry || '' });
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

export default function Staff() {
  const { employees, deleteEmployee, siteFilter } = useAppContext();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchesSite = !siteFilter || e.currentSite === siteFilter;
    return matchesSearch && matchesSite;
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
            <Input placeholder="Search staff..." className="pl-9 bg-white/5 border-white/10 text-sm h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="h-9" onClick={() => setAddOpen(true)} data-testid="button-open-add-employee">
            <Plus size={16} className="mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      <AddEmployeeModal open={addOpen} onOpenChange={setAddOpen} />
      {editEmployee && <EditEmployeeModal employee={editEmployee} onClose={() => setEditEmployee(null)} />}

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"><Users size={32} className="text-primary" /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No staff records found. Add employees manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} className="mr-2" /> Add Employee</Button>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Employee</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead className="text-muted-foreground">Insurance</TableHead>
                <TableHead className="text-muted-foreground">Compensation</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-white/10 hover:bg-white/5 transition-colors group cursor-pointer"
                  data-testid={`row-staff-${emp.id}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10 group-hover:border-primary/50 transition-colors">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.department}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{emp.role}</TableCell>
                  <TableCell>
                    <div className="text-sm">{emp.email}</div>
                    <div className="text-xs text-muted-foreground">{emp.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="outline" className={`text-[10px] px-2 ${getInsuranceColor(emp.insuranceStatus || 'Not Set')}`}>
                        {emp.insuranceStatus || 'Not Set'}
                      </Badge>
                      {emp.passportExpiry && (
                        <div className="text-[10px] text-muted-foreground">ID exp: {emp.passportExpiry}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(emp.basicSalary || 0) > 0 ? (
                      <div>
                        <div className="text-sm font-medium">{emp.basicSalary?.toLocaleString()} EGP</div>
                        {(emp.siteAllowance || 0) > 0 && (
                          <div className="text-xs text-muted-foreground">+{emp.siteAllowance?.toLocaleString()} allowance</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={emp.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setEditEmployee(emp)}
                        data-testid={`button-edit-employee-${emp.id}`}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteEmployee(emp.id)}
                        data-testid={`button-delete-employee-${emp.id}`}
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
