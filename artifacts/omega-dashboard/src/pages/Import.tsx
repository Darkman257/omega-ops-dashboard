import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileDown, CheckCircle2, ArrowRight, XCircle, Users } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Import() {
  const { importData } = useAppContext();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<'staff' | 'documents'>('staff');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const staffFields = ['name', 'role', 'department', 'phone', 'email', 'status'];
  const docFields = ['name', 'type', 'issuedDate', 'expiryDate'];
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
        
        setRawHeaders(headers);
        setRawData(data);
        
        // Auto-map logic (semantic matching)
        const initialMappings: Record<string, string> = {};
        const targetFields = type === 'staff' ? staffFields : docFields;
        
        headers.forEach((h, i) => {
          const lower = h.toLowerCase();
          let matched = '';
          
          if (type === 'staff') {
            if (lower.includes('name') || lower.includes('الاسم')) matched = 'name';
            else if (lower.includes('role') || lower.includes('job') || lower.includes('الوظيفة')) matched = 'role';
            else if (lower.includes('dept') || lower.includes('department') || lower.includes('القسم')) matched = 'department';
            else if (lower.includes('phone') || lower.includes('tel') || lower.includes('رقم')) matched = 'phone';
            else if (lower.includes('email') || lower.includes('mail') || lower.includes('بريد')) matched = 'email';
            else if (lower.includes('status') || lower.includes('حالة')) matched = 'status';
          } else {
            if (lower.includes('name') || lower.includes('الاسم')) matched = 'name';
            else if (lower.includes('type') || lower.includes('نوع')) matched = 'type';
            else if (lower.includes('issue') || lower.includes('start')) matched = 'issuedDate';
            else if (lower.includes('expir') || lower.includes('end')) matched = 'expiryDate';
          }
          
          if (matched && targetFields.includes(matched)) {
            initialMappings[i] = matched;
          }
        });
        
        setMappings(initialMappings);
        setStep(2);
      }
    };
    reader.readAsText(file);
  };

  const getPreviewData = () => {
    return rawData.slice(0, 5).map(row => {
      const obj: any = {};
      Object.entries(mappings).forEach(([idx, field]) => {
        if (field && field !== 'ignore') {
          obj[field] = row[parseInt(idx)] || '';
        }
      });
      return obj;
    });
  };

  const handleImport = () => {
    const allData = rawData.map(row => {
      const obj: any = {};
      Object.entries(mappings).forEach(([idx, field]) => {
        if (field && field !== 'ignore') {
          obj[field] = row[parseInt(idx)] || '';
        }
      });
      return obj;
    });

    importData(type, allData);
    setStep(4);
  };

  const targetFields = type === 'staff' ? staffFields : docFields;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Smart AI Importer</h1>
        <p className="text-muted-foreground">Upload and map your enterprise data seamlessly into the command center.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/10 z-0"></div>
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'Map Data' },
          { num: 3, label: 'Preview' },
          { num: 4, label: 'Complete' }
        ].map((s) => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
              step >= s.num ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(201,168,76,0.3)]' : 'bg-sidebar border border-white/10 text-muted-foreground'
            }`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-xs ${step >= s.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-4 block">What are you importing?</Label>
                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant={type === 'staff' ? 'default' : 'outline'} 
                      className={`flex-1 h-24 flex flex-col gap-2 ${type !== 'staff' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-foreground' : ''}`}
                      onClick={() => setType('staff')}
                    >
                      <Users size={24} />
                      <span>Staff Directory</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant={type === 'documents' ? 'default' : 'outline'} 
                      className={`flex-1 h-24 flex flex-col gap-2 ${type !== 'documents' ? 'bg-white/5 border-white/10 hover:bg-white/10 text-foreground' : ''}`}
                      onClick={() => setType('documents')}
                    >
                      <FileDown size={24} />
                      <span>Document Control</span>
                    </Button>
                  </div>
                </div>

                <div className="mt-8 border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium text-foreground mb-2">Upload CSV File</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Drag and drop your file here or click to browse. The system will automatically map Arabic or English headers using AI logic.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium mb-4">Map Columns</h3>
                <p className="text-sm text-muted-foreground mb-6">We've automatically detected headers. Please review and adjust the mapping below.</p>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {rawHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="flex-1 font-medium text-sm">{header} <span className="text-xs text-muted-foreground block font-normal mt-1">Sample: {rawData[0]?.[idx] || 'N/A'}</span></div>
                      <ArrowRight size={16} className="text-muted-foreground" />
                      <div className="flex-1">
                        <Select 
                          value={mappings[idx] || 'ignore'} 
                          onValueChange={(val) => setMappings({ ...mappings, [idx]: val })}
                        >
                          <SelectTrigger className="bg-background border-white/10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">-- Ignore Column --</SelectItem>
                            {targetFields.map(field => (
                              <SelectItem key={field} value={field}>{field}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-white/10">
                  <Button variant="outline" onClick={() => setStep(1)} className="bg-transparent border-white/10">Back</Button>
                  <Button onClick={() => setStep(3)}>Continue to Preview</Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium mb-4">Preview Data</h3>
                <p className="text-sm text-muted-foreground mb-6">Review a sample of how the data will appear in the system.</p>
                
                <div className="rounded-md border border-white/10 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10">
                        {targetFields.map(field => (
                          <TableHead key={field} className="capitalize text-muted-foreground">{field}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPreviewData().map((row, i) => (
                        <TableRow key={i} className="border-white/10">
                          {targetFields.map(field => (
                            <TableCell key={field} className="text-sm">{row[field] || <span className="text-muted-foreground/50">-</span>}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-sm text-muted-foreground">Showing 5 of {rawData.length} rows</div>

                <div className="flex justify-between pt-4 border-t border-white/10">
                  <Button variant="outline" onClick={() => setStep(2)} className="bg-transparent border-white/10">Back</Button>
                  <Button onClick={handleImport} className="gap-2">
                    <CheckCircle2 size={16} /> Import {rawData.length} Records
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="py-12 text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(201,168,76,0.2)]"
                >
                  <CheckCircle2 size={48} className="text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Import Successful</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">Successfully imported {rawData.length} records into the {type} module. The command center has been updated.</p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={() => { setStep(1); setRawData([]); }} className="bg-transparent border-white/10">Import More</Button>
                  <Button onClick={() => setLocation(`/${type}`)}>View {type === 'staff' ? 'Directory' : 'Documents'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
