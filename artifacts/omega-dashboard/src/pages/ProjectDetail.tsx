import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoute, useLocation } from 'wouter';
import { useAppContext, Project } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Users,
  Zap, HardHat, CheckCircle2, Circle, Pencil,
  ClipboardList, ShieldCheck, AlertTriangle, FileText,
  TrendingUp, Building2, Wrench, Layers
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const editSchema = z.object({
  name: z.string().min(1),
  client: z.string().min(1),
  status: z.enum(['Planning', 'In Progress', 'On Hold', 'Completed']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  budget: z.coerce.number().min(0),
  spent: z.coerce.number().min(0),
  location: z.string().min(1),
  description: z.string().optional(),
  projectValue: z.coerce.number().min(0),
  consultant: z.string().optional(),
  subcontractors: z.string().optional(),
  completionPercent: z.coerce.number().min(0).max(100),
  technicalSpecs: z.string().optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High', 'Critical']),
  insurancePolicyNumber: z.string().optional(),
  pmNotes: z.string().optional(),
  mepDetails: z.string().optional(),
  civilWorks: z.string().optional(),
  finishingStatus: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

const statusColors: Record<string, string> = {
  'Planning': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'In Progress': 'bg-primary/20 text-primary border-primary/30',
  'On Hold': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Completed': 'bg-green-500/20 text-green-300 border-green-500/30',
};

const riskColors: Record<string, string> = {
  'Low': 'bg-green-500/20 text-green-300 border-green-500/30',
  'Medium': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'High': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Critical': 'bg-red-500/20 text-red-300 border-red-500/30',
};

function StatCard({ label, value, sub, icon: Icon, gold }: { label: string; value: string; sub?: string; icon: any; gold?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${gold ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={gold ? 'text-primary' : 'text-muted-foreground'} />
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-xl font-bold ${gold ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function MilestoneTimeline({ project }: { project: Project }) {
  const milestones = project.milestones || [];
  if (milestones.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
        No milestones defined for this project.
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3.5 top-2 bottom-2 w-px bg-white/10" />
      <div className="space-y-0">
        {milestones.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, ease: 'easeOut' }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            <div className="absolute -left-8 top-0.5 flex items-center justify-center">
              {m.completed ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08 + 0.1 }}
                  className="w-7 h-7 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center"
                >
                  <CheckCircle2 size={14} className="text-primary" />
                </motion.div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center">
                  <Circle size={14} className="text-muted-foreground" />
                </div>
              )}
            </div>
            <div className={`flex-1 rounded-lg border p-4 ${m.completed ? 'bg-primary/5 border-primary/20' : 'bg-white/3 border-white/8'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-medium text-sm ${m.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{m.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.date)}</p>
                </div>
                <Badge className={m.completed ? 'bg-green-500/20 text-green-300 border-green-500/30 text-[10px]' : 'bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px]'}>
                  {m.completed ? 'Complete' : 'Pending'}
                </Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EditModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const { updateProject } = useAppContext();
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: project.name,
      client: project.client,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      spent: project.spent,
      location: project.location,
      description: project.description || '',
      projectValue: project.projectValue || 0,
      consultant: project.consultant || '',
      subcontractors: project.subcontractors || '',
      completionPercent: project.completionPercent ?? 0,
      technicalSpecs: project.technicalSpecs || '',
      riskLevel: project.riskLevel || 'Medium',
      insurancePolicyNumber: project.insurancePolicyNumber || '',
      pmNotes: project.pmNotes || '',
      mepDetails: project.mepDetails || '',
      civilWorks: project.civilWorks || '',
      finishingStatus: project.finishingStatus || '',
    }
  });

  const onSubmit = (values: EditFormValues) => {
    updateProject(project.id, {
      ...values,
      description: values.description || '',
      consultant: values.consultant || '',
      subcontractors: values.subcontractors || '',
      technicalSpecs: values.technicalSpecs || '',
      insurancePolicyNumber: values.insurancePolicyNumber || '',
      pmNotes: values.pmNotes || '',
      mepDetails: values.mepDetails || '',
      civilWorks: values.civilWorks || '',
      finishingStatus: values.finishingStatus || '',
    });
    onClose();
  };

  const inputClass = "bg-white/5 border-white/10 text-sm";
  const taClass = "bg-white/5 border-white/10 text-sm resize-none";

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[680px] bg-card border-white/10 text-foreground p-0 max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold">Edit Project — {project.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 max-h-[75vh]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 space-y-6">
              <section className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Core Details</p>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="client" render={({ field }) => (
                    <FormItem><FormLabel>Client</FormLabel><FormControl><Input {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Planning','In Progress','On Hold','Completed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="startDate" render={({ field }) => (
                    <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="completionPercent" render={({ field }) => (
                    <FormItem><FormLabel>Completion %</FormLabel><FormControl><Input type="number" min="0" max="100" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Financial & Team</p>
                <div className="grid grid-cols-3 gap-3">
                  <FormField control={form.control} name="projectValue" render={({ field }) => (
                    <FormItem><FormLabel>Project Value ($)</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="budget" render={({ field }) => (
                    <FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="spent" render={({ field }) => (
                    <FormItem><FormLabel>Spent ($)</FormLabel><FormControl><Input type="number" {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="consultant" render={({ field }) => (
                  <FormItem><FormLabel>Consultant</FormLabel><FormControl><Input {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="subcontractors" render={({ field }) => (
                  <FormItem><FormLabel>Sub-contractors (comma-separated)</FormLabel><FormControl><Input {...field} className={inputClass} /></FormControl><FormMessage /></FormItem>
                )} />
              </section>

              <section className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Risk & Compliance</p>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="riskLevel" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Risk Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger className={inputClass}><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {['Low','Medium','High','Critical'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="insurancePolicyNumber" render={({ field }) => (
                    <FormItem><FormLabel>Insurance Policy No.</FormLabel><FormControl><Input {...field} className={inputClass} placeholder="e.g. OTC-POL-2024-001" /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </section>

              <section className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Technical Documentation</p>
                <FormField control={form.control} name="technicalSpecs" render={({ field }) => (
                  <FormItem><FormLabel>Technical Specifications</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-28`} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="mepDetails" render={({ field }) => (
                  <FormItem><FormLabel>MEP Details</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-24`} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="civilWorks" render={({ field }) => (
                  <FormItem><FormLabel>Civil Works</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-24`} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="finishingStatus" render={({ field }) => (
                  <FormItem><FormLabel>Finishing Status</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-20`} /></FormControl><FormMessage /></FormItem>
                )} />
              </section>

              <section className="space-y-4 pt-2 border-t border-white/10">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Project Manager Notes</p>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-20`} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="pmNotes" render={({ field }) => (
                  <FormItem><FormLabel>PM Notes (internal)</FormLabel><FormControl><Textarea {...field} className={`${taClass} h-24`} /></FormControl><FormMessage /></FormItem>
                )} />
              </section>

              <Button type="submit" className="w-full" data-testid="button-save-project-detail">Save All Changes</Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectDetail() {
  const [, params] = useRoute('/projects/:id');
  const [, navigate] = useLocation();
  const { projects, employees } = useAppContext();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const project = projects.find(p => p.id === params?.id);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-32 text-center gap-4">
        <Building2 size={40} className="text-muted-foreground/40" />
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button onClick={() => navigate('/projects')} variant="outline">
          <ArrowLeft size={16} className="mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const assignedStaff = employees.filter(e => (project.assignedStaffIds || []).includes(e.id));
  const subcontractorList = (project.subcontractors || '').split(',').map(s => s.trim()).filter(Boolean);
  const budgetUtil = project.budget ? Math.round((project.spent / project.budget) * 100) : 0;
  const duration = (() => {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months >= 12 ? `${(months / 12).toFixed(1)} yrs` : `${months} mo`;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-0 -mt-2"
    >
      {editOpen && <EditModal project={project} onClose={() => setEditOpen(false)} />}

      <div className="relative overflow-hidden rounded-2xl mb-6"
        style={{ background: 'linear-gradient(135deg, hsl(222 47% 8%) 0%, hsl(222 47% 4%) 60%, hsl(222 47% 6%) 100%)' }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, hsl(43 74% 55% / 0.4) 0%, transparent 60%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="relative px-6 pt-5 pb-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm group"
            >
              <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
              Projects
            </button>
            <div className="flex items-center gap-2">
              <Badge className={`${statusColors[project.status]} pointer-events-none`}>{project.status}</Badge>
              <Button
                size="sm"
                variant="outline"
                className="border-white/20 hover:border-primary/50 hover:text-primary gap-1.5 h-8"
                onClick={() => setEditOpen(true)}
                data-testid="button-edit-project-detail"
              >
                <Pencil size={13} /> Edit
              </Button>
            </div>
          </div>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">{project.name}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5"><Building2 size={13} /> {project.client}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {project.location}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Project Value" value={formatCurrency(project.projectValue || project.budget)} icon={DollarSign} gold />
            <StatCard label="Budget Utilization" value={`${budgetUtil}%`} sub={`${formatCurrency(project.spent)} spent`} icon={TrendingUp} />
            <StatCard label="Completion" value={`${project.completionPercent ?? 0}%`} sub={duration} icon={CheckCircle2} />
            <StatCard
              label="Risk Level"
              value={project.riskLevel || 'Medium'}
              icon={AlertTriangle}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/10 mb-5 h-10">
          <TabsTrigger value="overview" className="gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <ClipboardList size={13} /> Overview
          </TabsTrigger>
          <TabsTrigger value="mep" className="gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Zap size={13} /> MEP & Civil
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Users size={13} /> Resources
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-1.5 text-xs data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
            <Layers size={13} /> Milestones
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" forceMount className={activeTab !== 'overview' ? 'hidden' : ''}>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <FileText size={14} className="text-primary" /> Project Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.description || 'No description provided.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ShieldCheck size={14} className="text-primary" /> Compliance & Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Risk Level</span>
                      <Badge className={`${riskColors[project.riskLevel || 'Medium']} text-xs pointer-events-none`}>{project.riskLevel || 'Medium'}</Badge>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Insurance Policy</span>
                      <span className="font-mono text-xs text-foreground">{project.insurancePolicyNumber || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Consultant</span>
                      <span className="text-right text-xs max-w-[180px]">{project.consultant || '—'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Wrench size={14} className="text-primary" /> Technical Specifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.technicalSpecs || 'No technical specifications recorded.'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <ClipboardList size={14} className="text-primary" /> Project Manager Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.pmNotes || 'No PM notes recorded.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="mep" forceMount className={activeTab !== 'mep' ? 'hidden' : ''}>
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Zap size={14} className="text-primary" /> MEP Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.mepDetails || 'No MEP details recorded.'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <HardHat size={14} className="text-primary" /> Civil Works
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.civilWorks || 'No civil works details recorded.'}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-primary" /> Finishing Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {project.finishingStatus || 'No finishing status recorded.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="resources" forceMount className={activeTab !== 'resources' ? 'hidden' : ''}>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users size={14} className="text-primary" /> Assigned Staff
                      <Badge className="bg-white/10 text-foreground border-white/10 text-[10px] ml-auto">{assignedStaff.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignedStaff.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        No staff assigned. Use the Edit modal to link team members.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {assignedStaff.map(emp => (
                          <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                            <div className="w-8 h-8 rounded-md bg-primary/15 border border-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Building2 size={14} className="text-primary" /> Sub-contractors
                      <Badge className="bg-white/10 text-foreground border-white/10 text-[10px] ml-auto">{subcontractorList.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subcontractorList.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground text-sm">No sub-contractors listed.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {subcontractorList.map((sc, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-medium"
                          >
                            {sc}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="milestones" forceMount className={activeTab !== 'milestones' ? 'hidden' : ''}>
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers size={14} className="text-primary" /> Project Milestones
                    <span className="ml-auto text-xs text-muted-foreground font-normal">
                      {(project.milestones || []).filter(m => m.completed).length} / {(project.milestones || []).length} complete
                    </span>
                  </CardTitle>
                  <div className="w-full bg-white/10 rounded-full h-1.5 mt-3">
                    <motion.div
                      className="bg-primary h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${project.milestones?.length
                          ? Math.round((project.milestones.filter(m => m.completed).length / project.milestones.length) * 100)
                          : 0}%`
                      }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <MilestoneTimeline project={project} />
                </CardContent>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}
