import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, Project } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Plus, Grid, List, Search } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  client: z.string().min(1, "Client is required"),
  status: z.enum(['Planning', 'In Progress', 'On Hold', 'Completed']),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  budget: z.coerce.number().min(0, "Budget must be positive"),
  spent: z.coerce.number().min(0, "Spent must be positive"),
  location: z.string().min(1, "Location is required"),
  description: z.string()
});

export default function Projects() {
  const { projects, addProject } = useAppContext();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      client: '',
      status: 'Planning',
      startDate: '',
      endDate: '',
      budget: 0,
      spent: 0,
      location: '',
      description: ''
    }
  });

  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    addProject(values);
    setOpen(false);
    form.reset();
  };

  const filtered = projects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.client.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'In Progress': return 'bg-primary/20 text-primary border-primary/30';
      case 'On Hold': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 bg-white/5 border-white/10 text-sm h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center border border-white/10 rounded-md p-1 bg-white/5">
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-7 w-7 rounded-sm ${view === 'grid' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setView('grid')}
            >
              <Grid size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-7 w-7 rounded-sm ${view === 'list' ? 'bg-white/10 text-foreground' : 'text-muted-foreground'}`}
              onClick={() => setView('list')}
            >
              <List size={14} />
            </Button>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9">
                <Plus size={16} className="mr-2" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Project Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="client" render={({ field }) => (
                      <FormItem><FormLabel>Client</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select status" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Planning">Planning</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="On Hold">On Hold</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem><FormLabel>End Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="budget" render={({ field }) => (
                      <FormItem><FormLabel>Budget ($)</FormLabel><FormControl><Input type="number" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full">Create Project</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Briefcase size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No projects found. Add a project manually or upload a spreadsheet to populate this module.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" /> Add Project</Button>
          </div>
        </div>
      ) : (
        <motion.div 
          className={view === 'grid' ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {filtered.map((project, i) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {view === 'grid' ? (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors h-full overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{project.client}</p>
                      </div>
                      <Badge className={`${getStatusColor(project.status)} pointer-events-none`}>{project.status}</Badge>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Timeline</span>
                        <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Location</span>
                        <span className="truncate max-w-[150px]">{project.location}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Budget Utilization</p>
                          <p className="font-semibold text-lg text-primary">{formatCurrency(project.spent)} <span className="text-sm font-normal text-muted-foreground">/ {formatCurrency(project.budget)}</span></p>
                        </div>
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray="125" strokeDashoffset={125 - (125 * (project.spent / (project.budget || 1)))} strokeLinecap="round" />
                          </svg>
                          <span className="text-[10px] font-medium">{project.budget ? Math.round((project.spent / project.budget) * 100) : 0}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/30 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base line-clamp-1">{project.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{project.client} • {project.location}</p>
                    </div>
                    <div className="w-48 text-sm">
                      <div className="text-muted-foreground text-xs mb-1">Timeline</div>
                      <div>{formatDate(project.startDate)}</div>
                    </div>
                    <div className="w-48 text-sm">
                      <div className="text-muted-foreground text-xs mb-1">Budget</div>
                      <div className="font-medium text-primary">{formatCurrency(project.budget)}</div>
                    </div>
                    <div className="w-32 flex justify-end">
                      <Badge className={`${getStatusColor(project.status)} pointer-events-none`}>{project.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
