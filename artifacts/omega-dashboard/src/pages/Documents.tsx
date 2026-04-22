import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext, DocumentType } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Search, FileArchive, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ScrollArea } from '@/components/ui/scroll-area';
import * as z from 'zod';
import { Badge } from '@/components/ui/badge';
import { formatDate, getDocumentStatus } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const documentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Contract', 'Permit', 'License', 'Other']),
  issuedDate: z.string().min(1, 'Issue date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  notes: z.string().optional(),
  departmentOwner: z.string().optional(),
  lastRenewed: z.string().optional()
});

type DocumentFormValues = z.infer<typeof documentSchema>;

const defaultValues: DocumentFormValues = {
  name: '',
  type: 'Contract',
  issuedDate: '',
  expiryDate: '',
  notes: '',
  departmentOwner: '',
  lastRenewed: ''
};

function DocumentFormFields({ form }: { form: any }) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="name" render={({ field }) => (
        <FormItem><FormLabel>Document Name</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-2 gap-3">
        <FormField control={form.control} name="type" render={({ field }) => (
          <FormItem>
            <FormLabel>Document Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger></FormControl>
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
        <FormField control={form.control} name="departmentOwner" render={({ field }) => (
          <FormItem><FormLabel>Department Owner</FormLabel><FormControl><Input {...field} className="bg-white/5 border-white/10" placeholder="e.g. Engineering" /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <FormField control={form.control} name="issuedDate" render={({ field }) => (
          <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="expiryDate" render={({ field }) => (
          <FormItem><FormLabel>Expiry Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="lastRenewed" render={({ field }) => (
          <FormItem><FormLabel>Last Renewed</FormLabel><FormControl><Input type="date" {...field} className="bg-white/5 border-white/10" /></FormControl><FormMessage /></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="notes" render={({ field }) => (
        <FormItem><FormLabel>Notes</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 resize-none h-20" placeholder="Additional notes..." /></FormControl><FormMessage /></FormItem>
      )} />
    </div>
  );
}

function AddDocumentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { addDocument } = useAppContext();
  const form = useForm<DocumentFormValues>({ resolver: zodResolver(documentSchema), defaultValues });

  const onSubmit = (values: DocumentFormValues) => {
    addDocument({
      ...values,
      notes: values.notes || '',
      departmentOwner: values.departmentOwner || '',
      lastRenewed: values.lastRenewed || ''
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold">Add New Document</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DocumentFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-add-document">Add Document</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function EditDocumentModal({ doc, onClose }: { doc: DocumentType; onClose: () => void }) {
  const { updateDocument } = useAppContext();
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      name: doc.name,
      type: doc.type,
      issuedDate: doc.issuedDate,
      expiryDate: doc.expiryDate,
      notes: doc.notes || '',
      departmentOwner: doc.departmentOwner || '',
      lastRenewed: doc.lastRenewed || ''
    }
  });

  const onSubmit = (values: DocumentFormValues) => {
    updateDocument(doc.id, {
      ...values,
      notes: values.notes || '',
      departmentOwner: values.departmentOwner || '',
      lastRenewed: values.lastRenewed || ''
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[480px] bg-card border-white/10 text-foreground p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold">Edit Document</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DocumentFormFields form={form} />
                <div className="pt-4">
                  <Button type="submit" className="w-full" data-testid="button-save-document">Save Changes</Button>
                </div>
              </form>
            </Form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Documents() {
  const { documents, deleteDocument } = useAppContext();
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentType | null>(null);

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.type.toLowerCase().includes(search.toLowerCase()) ||
    (d.departmentOwner || '').toLowerCase().includes(search.toLowerCase())
  );

  const renderStatusBadge = (expiryDate: string) => {
    const status = getDocumentStatus(expiryDate);
    switch (status) {
      case 'Valid': return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Valid</Badge>;
      case 'Expiring Soon': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">Expiring Soon</Badge>;
      case 'Expired': return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Expired</Badge>;
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
            <Input placeholder="Search documents..." className="pl-9 bg-white/5 border-white/10 text-sm h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button className="h-9" onClick={() => setAddOpen(true)} data-testid="button-open-add-document">
            <Plus size={16} className="mr-2" /> Add Document
          </Button>
        </div>
      </div>

      <AddDocumentModal open={addOpen} onOpenChange={setAddOpen} />
      {editDoc && <EditDocumentModal doc={editDoc} onClose={() => setEditDoc(null)} />}

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6"><FileArchive size={32} className="text-primary" /></div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">No data available</h2>
          <p className="text-muted-foreground mb-6 max-w-[400px]">No documents on record. Add entries manually or upload a spreadsheet to populate this module.</p>
          <Button onClick={() => setAddOpen(true)}><Plus size={16} className="mr-2" /> Add Document</Button>
        </div>
      ) : (
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Document</TableHead>
                <TableHead className="text-muted-foreground">Type</TableHead>
                <TableHead className="text-muted-foreground">Dept. Owner</TableHead>
                <TableHead className="text-muted-foreground">Issued</TableHead>
                <TableHead className="text-muted-foreground">Last Renewed</TableHead>
                <TableHead className="text-muted-foreground">Expiry</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="w-20"></TableHead>
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
                  data-testid={`row-document-${doc.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      <span className="line-clamp-1">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.type}</TableCell>
                  <TableCell className="text-sm">
                    {doc.departmentOwner ? (
                      <span className="text-foreground">{doc.departmentOwner}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(doc.issuedDate)}</TableCell>
                  <TableCell className="text-sm">
                    {doc.lastRenewed ? (
                      <span className="text-foreground">{formatDate(doc.lastRenewed)}</span>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatDate(doc.expiryDate)}</TableCell>
                  <TableCell>{renderStatusBadge(doc.expiryDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setEditDoc(doc)}
                        data-testid={`button-edit-document-${doc.id}`}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                        data-testid={`button-delete-document-${doc.id}`}
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
