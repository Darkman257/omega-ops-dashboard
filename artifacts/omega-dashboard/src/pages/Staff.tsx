import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Plus, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  department: z.string().min(1, "Department is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  status: z.enum(['Active', 'Inactive'])
});

export default function Staff() {
  const { employees, addEmployee } = useAppContext();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      role: '',
      department: '',
      phone: '',
      email: '',
      status: 'Active'
    }
  });

  const onSubmit = (values: z.infer<typeof employeeSchema>) => {
    addEmployee(values);
    setOpen(false);
    form.reset();
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff Directory</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search staff..." 
              className="pl-9 bg-white/5 border-white/10 text-sm h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9">
                <Plus size={16} className="mr-2" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="role" render={({ field }) => (
                      <FormItem><FormLabel>Role</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="department" render={({ field }) => (
                      <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select status" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full">Add Employee</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Users size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No staff records found. Add employees manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" /> Add Employee</Button>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Employee</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
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
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-white/10 group-hover:border-primary/50 transition-colors">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm text-foreground">{emp.name}</div>
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
                    <Badge variant="outline" className={
                      emp.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }>
                      {emp.status}
                    </Badge>
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
