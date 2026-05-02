import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { useAppContext, Project } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Briefcase, Plus, Grid, List, Search, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as z from 'zod';
import { calculateProjectFinancials } from '@/lib/financials';

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client: z.string().min(1, 'Client is required'),
  status: z.enum(['Planning', 'In Progress', 'On Hold', 'Completed']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  budget: z.coerce.number().min(0),
  spent: z.coerce.number().min(0),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  projectValue: z.coerce.number().min(0),
  consultant: z.string().optional(),
  subcontractors: z.string().optional(),
  completionPercent: z.coerce.number().min(0).max(100),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  insurancePolicyNumber: z.string().optional(),
  technicalSpecs: z.string().optional(),
  pmNotes: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const emptyDefaults: ProjectFormValues = {
  name: '', client: '', status: 'Planning', startDate: '', endDate: '',
  budget: 0, spent: 0, location: '', description: '',
  projectValue: 0, consultant: '', subcontractors: '',
  completionPercent: 0, riskLevel: 'Medium',
  insurancePolicyNumber: '', technicalSpecs: '', pmNotes: ''
};

const statusColors: Record<string, string> = {
  'Planning': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'In Progress': 'bg-primary/20 text-primary border-primary/30',
  'On Hold': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Completed': 'bg-green-500/20 text-green-400 border-green-500/30',
};

const riskColors: Record<string, string> = {
  'Low': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'High': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
};

function QuickFormFields({ form }: { form: any }) {
  const iClass = "bg-white/5 border-white/10 text-sm";
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="client" render={({ field }) => (
          <FormItem><FormLabel>Client</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {['Planning','In Progress','On Hold','Completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="startDate" render={({ field }) => (
          <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="endDate" render={({ field }) => (
          <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="completionPercent" render={({ field }) => (
          <FormItem><FormLabel>Completion %</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="projectValue" render={({ field }) => (
          <FormItem><FormLabel>Project Value ($)</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="budget" render={({ field }) => (
          <FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="consultant" render={({ field }) => (
        <FormItem><FormLabel>Consultant</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="subcontractors" render={({ field }) => (
        <FormItem><FormLabel>Sub-contractors (comma-separated)</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="riskLevel" render={({ field }) => (
          <FormItem>
            <FormLabel>Risk Level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className={iClass}><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {['Low','Medium','High','Critical'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormItem>
        )} />
        <FormField control={form.control} name="insurancePolicyNumber" render={({ field }) => (
          <FormItem><FormLabel>Insurance Policy No.</FormLabel><FormControl><Input {...field} className={iClass} /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="technicalSpecs" render={({ field }) => (
        <FormItem><FormLabel>Technical Specifications</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 text-sm resize-none h-20" /></FormControl><FormMessage /></FormItem>
      )} />
      <FormField control={form.control} name="pmNotes" render={({ field }) => (
        <FormItem><FormLabel>PM Notes</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 text-sm resize-none h-16" /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );
}

function AddModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addProject } = useAppContext();
  const form = useForm<ProjectFormValues>({ resolver: zodResolver(projectSchema), defaultValues: emptyDefaults });

  const onSubmit = (values: ProjectFormValues) => {
    addProject({
      ...values,
      description: values.description || '',
      consultant: values.consultant || '',
      subcontractors: values.subcontractors || '',
      technicalSpecs: values.technicalSpecs || '',
      insurancePolicyNumber: values.insurancePolicyNumber || '',
      pmNotes: values.pmNotes || '',
      mepDetails: '',
      civilWorks: '',
      finishingStatus: '',
      milestones: [],
      assignedStaffIds: [],
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <QuickFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-create-project">Create Project</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const { updateProject } = useAppContext();
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name, client: project.client, status: project.status,
      startDate: project.startDate, endDate: project.endDate,
      budget: project.budget, spent: project.spent, location: project.location,
      description: project.description || '',
      projectValue: project.projectValue || 0,
      consultant: project.consultant || '',
      subcontractors: project.subcontractors || '',
      completionPercent: project.completionPercent ?? 0,
      riskLevel: project.riskLevel || 'Medium',
      insurancePolicyNumber: project.insurancePolicyNumber || '',
      technicalSpecs: project.technicalSpecs || '',
      pmNotes: project.pmNotes || '',
    }
  });

  const onSubmit = (values: ProjectFormValues) => {
    updateProject(project.id, {
      ...values,
      description: values.description || '',
      consultant: values.consultant || '',
      subcontractors: values.subcontractors || '',
      technicalSpecs: values.technicalSpecs || '',
      insurancePolicyNumber: values.insurancePolicyNumber || '',
      pmNotes: values.pmNotes || '',
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[540px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <QuickFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-save-project">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Projects() {
  const { projects, payrollRecords, deleteProject } = useAppContext();
  const [, navigate] = useLocation();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." className="pl-9 bg-white/5 border-white/10 text-sm h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center border border-white/10 rounded-md p-1 bg-white/5">
            <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-sm ${view === 'grid' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`} onClick={() => setView('grid')}><Grid size={14} /></Button>
            <Button variant="ghost" size="icon" className={`h-7 w-7 rounded-sm ${view === 'list' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`} onClick={() => setView('list')}><List size={14} /></Button>
          </div>
          <Button className="h-9" onClick={() => setAddOpen(true)} data-testid="button-add-project">
            <Plus size={16} className="mr-2" /> Add Project
          </Button>
        </div>
      </div>

      <AddModal open={addOpen} onOpenChange={setAddOpen} />
      {editProject && <EditModal project={editProject} onClose={() => setEditProject(null)} />}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"><Briefcase size={32} className="text-primary" /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No projects found. Add a project manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} className="mr-2" /> Add Project</Button>
        </div>
      ) : (
        <motion.div
          className={view === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          {filtered.map((project, i) => {
            const financials = calculateProjectFinancials(project, payrollRecords);
            const riskColor = financials.riskLevel === 'HIGH_RISK' ? 'text-red-400' : financials.riskLevel === 'MEDIUM_RISK' ? 'text-orange-400' : 'text-green-400';

            return (
              <motion.div key={project.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                {view === 'grid' ? (
                  <Card
                    className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/40 transition-all h-full group relative cursor-pointer hover:bg-white/[0.07]"
                    onClick={() => navigate(`/projects/${project.id}`)}
                    data-testid={`card-project-${project.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">{project.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{project.client}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                            title="Expand"
                          >
                            <ArrowUpRight size={13} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); setEditProject(project); }}
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Payroll Cost</p>
                          <p className="text-sm font-bold">{formatCurrency(financials.totalPayrollCost)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Burn Rate</p>
                          <p className={`text-sm font-bold ${riskColor}`}>{financials.payrollBurnRate.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Gross Remaining</span>
                          <span className="text-xs font-semibold text-primary">{formatCurrency(financials.grossRemaining)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Timeline</span>
                          <span className="text-xs">{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Project Value</p>
                            <p className="font-semibold text-primary text-sm">{formatCurrency(project.projectValue || project.budget)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {project.riskLevel && (
                              <Badge className={`${riskColors[project.riskLevel]} text-[10px] pointer-events-none`}>{project.riskLevel}</Badge>
                            )}
                            <Badge className={`${statusColors[project.status]} text-[10px] pointer-events-none`}>{project.status}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{ width: `${project.completionPercent ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-foreground">{project.completionPercent ?? 0}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{project.name}</h3>
                        <p className="text-xs text-muted-foreground">{project.client} · {project.location}</p>
                      </div>
                      <div className="w-32 hidden md:block text-right">
                        <p className="text-[10px] text-muted-foreground uppercase">Burn Rate</p>
                        <p className={`text-sm font-bold ${riskColor}`}>{financials.payrollBurnRate.toFixed(1)}%</p>
                      </div>
                      <div className="w-32">
                        <p className="text-xs text-muted-foreground">Value</p>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(project.projectValue || project.budget)}</p>
                      </div>
                      <div className="w-16 text-center">
                        <p className="text-xs text-muted-foreground">Done</p>
                        <p className="text-sm font-bold">{project.completionPercent ?? 0}%</p>
                      </div>
                      <Badge className={`${statusColors[project.status]} pointer-events-none text-xs w-24 justify-center`}>{project.status}</Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditProject(project)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteProject(project.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
