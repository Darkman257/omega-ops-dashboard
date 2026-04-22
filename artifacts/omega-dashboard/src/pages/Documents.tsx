import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Search, FileArchive } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { formatDate, getDocumentStatus } from '@/lib/utils';

const documentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(['Contract', 'Permit', 'License', 'Other']),
  issuedDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional()
});

export default function Documents() {
  const { documents, addDocument } = useAppContext();
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: '',
      type: 'Contract',
      issuedDate: '',
      expiryDate: '',
      notes: ''
    }
  });

  const onSubmit = (values: z.infer<typeof documentSchema>) => {
    addDocument({ ...values, notes: values.notes || '' });
    setOpen(false);
    form.reset();
  };

  const filtered = documents.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.type.toLowerCase().includes(search.toLowerCase())
  );

  const renderStatusBadge = (expiryDate: string) => {
    const status = getDocumentStatus(expiryDate);
    switch (status) {
      case 'Valid': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Valid</Badge>;
      case 'Expiring Soon': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Expiring Soon</Badge>;
      case 'Expired': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Document Control</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search documents..." 
              className="pl-9 bg-white/5 border-white/10 text-sm h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9">
                <Plus size={16} className="mr-2" /> Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
              <DialogHeader>
                <DialogTitle>Add New Document</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select type" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Permit">Permit</SelectItem>
                          <SelectItem value="License">License</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="issuedDate" render={({ field }) => (
                      <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="expiryDate" render={({ field }) => (
                      <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <Button type="submit" className="w-full">Add Document</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <FileArchive size={32} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No documents on record. Add entries manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setOpen(true)}><Plus size={16} className="mr-2" /> Add Document</Button>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Issued</TableHead>
                <TableHead className="text-muted-foreground">Expiry</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc, i) => (
                <motion.tr 
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-white/10 hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      {doc.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(doc.issuedDate)}</TableCell>
                  <TableCell className="text-sm font-medium">{formatDate(doc.expiryDate)}</TableCell>
                  <TableCell>
                    {renderStatusBadge(doc.expiryDate)}
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
