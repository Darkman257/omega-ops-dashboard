import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext, SiteAdminTask, Project, Employee } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ClipboardList, Plus, Search, Pencil, Trash2, 
  AlertCircle, CheckCircle2, Clock, Ban,
  Filter, Calendar as CalendarIcon, User, Building2,
  MoreVertical, ChevronDown, Flag
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const taskSchema = z.object({
  projectId: z.string().optional(),
  responsibleStaffId: z.string().optional(),
  taskCategory: z.string().min(1, 'Category is required'),
  taskTitle: z.string().min(1, 'Title is required'),
  taskDate: z.string().min(1, 'Date is required'),
  status: z.enum(['pending', 'in_progress', 'done', 'blocked']),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  notes: z.string().optional()
});

type TaskFormValues = z.infer<typeof taskSchema>;

const CATEGORIES = [
  "Attendance", "Absence / Delay", "Payroll Prep", "Advances / Penalties",
  "Onboarding", "Offboarding", "Housing", "Housing Problems",
  "Medical / Sick Leave", "Materials Movement", "Materials Consumption",
  "Fleet / Vehicles", "Fuel", "Maintenance", "Worker Transport",
  "Site Mission", "Contractor Follow-up", "Supplier Follow-up",
  "Daily Operations", "Safety / Incident", "Documents", "Other"
];

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  in_progress: { label: 'In Progress', icon: Activity, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  done: { label: 'Done', icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-500/10 text-red-500 border-red-500/20' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  normal: { label: 'Normal', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  critical: { label: 'Critical', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
};

function Activity({ size, className }: { size?: number, className?: string }) {
  return <ActivityIcon size={size} className={className} />;
}
import { Activity as ActivityIcon } from 'lucide-react';

function TaskFormFields({ form, projects, employees }: { form: any, projects: Project[], employees: Employee[] }) {
  const iClass = "bg-white/5 border-white/10 text-sm";
  
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="projectId" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Project</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue placeholder="Select Project" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="none">Internal / Office</SelectItem>
                {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="responsibleStaffId" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Responsible Person</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue placeholder="Select Staff" /></SelectTrigger></FormControl>
              <SelectContent>
                {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name} ({e.internalCode})</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="taskCategory" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Category</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue placeholder="Category" /></SelectTrigger></FormControl>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="taskDate" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Task Date</FormLabel>
            <FormControl><Input type="date" {...field} className={iClass} /></FormControl>
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="taskTitle" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Task Title</FormLabel>
          <FormControl><Input placeholder="e.g. Verify morning attendance" {...field} className={iClass} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />

      <div className="grid grid-cols-2 gap-4">
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([val, { label }]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="priority" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Priority</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([val, { label }]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>

      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs uppercase tracking-wider text-muted-foreground">Notes</FormLabel>
          <FormControl><Input {...field} className={iClass} /></FormControl>
        </FormItem>
      )} />
    </div>
  );
}

function AddTaskModal({ open, onOpenChange, projects, employees }: { open: boolean; onOpenChange: (v: boolean) => void, projects: Project[], employees: Employee[] }) {
  const { addSiteAdminTask } = useAppContext();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskCategory: 'Daily Operations',
      taskTitle: '',
      taskDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      priority: 'normal',
      notes: ''
    }
  });

  const onSubmit = (values: TaskFormValues) => {
    addSiteAdminTask({
      ...values,
      projectId: values.projectId === 'none' ? undefined : values.projectId,
      notes: values.notes || ''
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-bold">Create New Site Task</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TaskFormFields form={form} projects={projects} employees={employees} />
                <Button type="submit" className="w-full bg-primary text-black font-bold h-11 hover:scale-[1.01] transition-transform">
                  Create Task
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditTaskModal({ task, onClose, projects, employees }: { task: SiteAdminTask; onClose: () => void, projects: Project[], employees: Employee[] }) {
  const { updateSiteAdminTask } = useAppContext();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      projectId: task.projectId || 'none',
      responsibleStaffId: task.responsibleStaffId,
      taskCategory: task.taskCategory,
      taskTitle: task.taskTitle,
      taskDate: task.taskDate,
      status: task.status,
      priority: task.priority,
      notes: task.notes
    }
  });

  const onSubmit = (values: TaskFormValues) => {
    updateSiteAdminTask(task.id, {
      ...values,
      projectId: values.projectId === 'none' ? undefined : values.projectId,
      notes: values.notes || ''
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[550px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-bold">Edit Site Task</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <TaskFormFields form={form} projects={projects} employees={employees} />
                <Button type="submit" className="w-full bg-primary text-black font-bold h-11 hover:scale-[1.01] transition-transform">
                  Save Changes
                </Button>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function SiteAdminTasks() {
  const { siteAdminTasks, projects, employees, deleteSiteAdminTask, siteFilter, loading } = useAppContext();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<SiteAdminTask | null>(null);

  const filtered = siteAdminTasks.filter(t => {
    const project = projects.find(p => p.id === t.projectId);
    const staff = employees.find(e => e.id === t.responsibleStaffId);
    
    const matchesSearch = !search || 
      t.taskTitle.toLowerCase().includes(search.toLowerCase()) ||
      t.taskCategory.toLowerCase().includes(search.toLowerCase()) ||
      (project && project.name.toLowerCase().includes(search.toLowerCase())) ||
      (staff && staff.name.toLowerCase().includes(search.toLowerCase()));

    const matchesSite = !siteFilter || t.projectId === siteFilter;
    
    return matchesSearch && matchesSite;
  }).sort((a, b) => new Date(b.taskDate).getTime() - new Date(a.taskDate).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ClipboardList className="text-primary" /> Site Tasks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Daily operational tasks and site administrator activity log.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tasks, staff, projects..." 
              className="pl-9 bg-white/5 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddOpen(true)} className="bg-primary text-black font-bold gap-2">
            <Plus size={18} /> New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Pending</p>
                <p className="text-2xl font-bold mt-1">{filtered.filter(t => t.status === 'pending').length}</p>
              </div>
              <Clock className="text-yellow-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">In Progress</p>
                <p className="text-2xl font-bold mt-1">{filtered.filter(t => t.status === 'in_progress').length}</p>
              </div>
              <ActivityIcon className="text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Done Today</p>
                <p className="text-2xl font-bold mt-1">
                  {filtered.filter(t => t.status === 'done' && t.taskDate === new Date().toISOString().split('T')[0]).length}
                </p>
              </div>
              <CheckCircle2 className="text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Critical</p>
                <p className="text-2xl font-bold mt-1">{filtered.filter(t => t.priority === 'critical' && t.status !== 'done').length}</p>
              </div>
              <AlertCircle className="text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10 overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Task & Category</TableHead>
              <TableHead>Project / Site</TableHead>
              <TableHead>Responsible</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((task, idx) => {
                  const project = projects.find(p => p.id === task.projectId);
                  const staff = employees.find(e => e.id === task.responsibleStaffId);
                  const status = STATUS_CONFIG[task.status];
                  const priority = PRIORITY_CONFIG[task.priority];
                  const StatusIcon = status.icon;

                  return (
                    <motion.tr
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-white/10 hover:bg-white/5 transition-colors group"
                    >
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {task.taskDate}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-foreground leading-none">{task.taskTitle}</p>
                          <p className="text-[10px] uppercase tracking-widest text-primary/70 font-bold">{task.taskCategory}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <Building2 size={12} className="text-muted-foreground" />
                          <span>{project ? project.name : 'Internal'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <User size={12} className="text-muted-foreground" />
                          <span>{staff ? staff.name : 'Unassigned'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 text-[10px] ${status.color}`}>
                          <StatusIcon size={10} /> {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] px-2 border-opacity-30 ${priority.color}`}>
                          {priority.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-white/10 text-foreground">
                            <DropdownMenuItem onClick={() => setEditTask(task)} className="gap-2 cursor-pointer">
                              <Pencil size={14} /> Edit Task
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteSiteAdminTask(task.id)} className="gap-2 text-red-400 focus:text-red-400 cursor-pointer">
                              <Trash2 size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  );
                })
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>

      <AddTaskModal 
        open={addOpen} 
        onOpenChange={setAddOpen} 
        projects={projects} 
        employees={employees} 
      />
      
      {editTask && (
        <EditTaskModal 
          task={editTask} 
          onClose={() => setEditTask(null)} 
          projects={projects} 
          employees={employees} 
        />
      )}
    </div>
  );
}
