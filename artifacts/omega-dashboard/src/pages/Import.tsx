import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileDown, CheckCircle2, ArrowRight, Users, Banknote, FileText } from 'lucide-react';
import { useLocation } from 'wouter';

type ImportType = 'staff' | 'documents' | 'payroll';

const TYPE_CONFIG: Record<ImportType, { label: string; icon: any; fields: string[]; description: string }> = {
  staff: {
    label: 'Staff Directory',
    icon: Users,
    fields: ['name', 'role', 'department', 'phone', 'email', 'status'],
    description: 'Import employee records including contact details and department'
  },
  documents: {
    label: 'Document Control',
    icon: FileDown,
    fields: ['name', 'type', 'issuedDate', 'expiryDate'],
    description: 'Import contracts, permits, and licenses with expiry dates'
  },
  payroll: {
    label: 'Payroll & Attendance',
    icon: Banknote,
    fields: ['employeeName', 'role', 'department', 'siteName', 'month', 'basicSalary', 'siteAllowance', 'overtimePay', 'deductions', 'status'],
    description: 'Import payroll records — Net Salary is auto-calculated from the imported fields'
  }
};

function autoMap(headers: string[], type: ImportType): Record<string, string> {
  const map: Record<string, string> = {};
  headers.forEach((h, i) => {
    const l = h.toLowerCase().trim();
    let matched = '';
    if (type === 'staff') {
      if (l.includes('name') || l === 'الاسم' || l.includes('full')) matched = 'name';
      else if (l.includes('role') || l.includes('job') || l.includes('title') || l === 'الوظيفة' || l.includes('position')) matched = 'role';
      else if (l.includes('dept') || l.includes('department') || l === 'القسم' || l.includes('division')) matched = 'department';
      else if (l.includes('phone') || l.includes('tel') || l.includes('mobile') || l === 'رقم') matched = 'phone';
      else if (l.includes('email') || l.includes('mail') || l === 'بريد') matched = 'email';
      else if (l.includes('status') || l === 'حالة' || l.includes('active')) matched = 'status';
    } else if (type === 'documents') {
      if (l.includes('name') || l === 'الاسم' || l.includes('title') || l.includes('doc')) matched = 'name';
      else if (l.includes('type') || l === 'نوع' || l.includes('category')) matched = 'type';
      else if (l.includes('issue') || l.includes('start') || l.includes('created')) matched = 'issuedDate';
      else if (l.includes('expir') || l.includes('end') || l.includes('valid') || l.includes('due')) matched = 'expiryDate';
    } else if (type === 'payroll') {
      if (l.includes('emp') || l.includes('name') || l === 'الاسم' || l === 'اسم الموظف' || l === 'الموظف' || l.includes('worker')) matched = 'employeeName';
      else if (l.includes('role') || l.includes('title') || l.includes('position') || l === 'الوظيفة' || l === 'المسمى الوظيفي' || l === 'المسمى') matched = 'role';
      else if (l.includes('dept') || l.includes('department') || l === 'القسم' || l === 'الإدارة' || l === 'قسم') matched = 'department';
      else if (l.includes('site') || l.includes('project') || l.includes('location') || l === 'الموقع' || l === 'المشروع' || l === 'موقع') matched = 'siteName';
      else if (l.includes('month') || l.includes('period') || l === 'الشهر' || l === 'شهر' || l === 'تاريخ') matched = 'month';
      else if (l === 'basic' || l.includes('basic') || l.includes('base') || l === 'الراتب الأساسي' || l === 'الراتب' || l === 'مرتب أساسي' || l === 'راتب' || l === 'salary') matched = 'basicSalary';
      else if (l.includes('allow') || l === 'بدل الموقع' || l === 'بدل موقع' || l === 'بدل') matched = 'siteAllowance';
      else if (l.includes('over') || l.includes('extra') || l === 'إضافي' || l === 'عمل إضافي' || l === 'أوفر تايم' || l === 'ساعات إضافية' || l === 'ot') matched = 'overtimePay';
      else if (l.includes('deduct') || l.includes('absent') || l === 'خصومات' || l === 'خصم' || l === 'الخصومات' || l === 'الخصم') matched = 'deductions';
      else if (l.includes('status') || l.includes('paid') || l === 'الحالة' || l === 'حالة الدفع') matched = 'status';
    }
    if (matched && TYPE_CONFIG[type].fields.includes(matched)) {
      map[i] = matched;
    }
  });
  return map;
}

export default function Import() {
  const { importData } = useAppContext();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [type, setType] = useState<ImportType>('staff');
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const cfg = TYPE_CONFIG[type];

  const processSheetData = (headers: string[], data: string[][]) => {
    setRawHeaders(headers);
    setRawData(data);
    setMappings(autoMap(headers, type));
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
        if (rows.length > 0) processSheetData(rows[0].map(String), rows.slice(1).map(r => r.map(String)));
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          const body = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
          processSheetData(headers, body);
        }
      };
      reader.readAsText(file);
    }
  };

  const getPreviewData = () =>
    rawData.slice(0, 5).map(row => {
      const obj: any = {};
      Object.entries(mappings).forEach(([idx, field]) => {
        if (field && field !== 'ignore') obj[field] = row[parseInt(idx)] || '';
      });
      return obj;
    });

  const handleImport = () => {
    const allData = rawData.map(row => {
      const obj: any = {};
      Object.entries(mappings).forEach(([idx, field]) => {
        if (field && field !== 'ignore') obj[field] = row[parseInt(idx)] || '';
      });
      return obj;
    });
    importData(type, allData);
    setStep(4);
  };

  const redirectTarget = type === 'staff' ? '/staff' : type === 'payroll' ? '/payroll' : '/documents';
  const redirectLabel = type === 'staff' ? 'Staff Directory' : type === 'payroll' ? 'Payroll' : 'Documents';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Smart Data Importer</h1>
        <p className="text-muted-foreground">Upload Excel or CSV files to populate Staff, Payroll, or Documents. Headers are auto-detected — including Arabic column names.</p>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/10 z-0" />
        {[{ num: 1, label: 'Upload' }, { num: 2, label: 'Map Data' }, { num: 3, label: 'Preview' }, { num: 4, label: 'Complete' }].map(s => (
          <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${step >= s.num ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(201,168,76,0.3)]' : 'bg-sidebar border border-white/10 text-muted-foreground'}`}>
              {step > s.num ? <CheckCircle2 size={16} /> : s.num}
            </div>
            <span className={`text-xs ${step >= s.num ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-8">
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <Label className="text-lg font-medium mb-4 block">What are you importing?</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(TYPE_CONFIG) as [ImportType, typeof TYPE_CONFIG[ImportType]][]).map(([key, cfg]) => (
                      <Button
                        key={key}
                        type="button"
                        variant={type === key ? 'default' : 'outline'}
                        className={`h-24 flex flex-col gap-2 ${type !== key ? 'bg-white/5 border-white/10 hover:bg-white/10 text-foreground' : ''}`}
                        onClick={() => setType(key)}
                      >
                        <cfg.icon size={22} />
                        <span className="text-sm">{cfg.label}</span>
                      </Button>
                    ))}
                  </div>
                  {cfg.description && (
                    <p className="text-sm text-muted-foreground mt-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                      {cfg.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 border-2 border-dashed border-white/10 rounded-xl p-12 text-center hover:bg-white/5 hover:border-primary/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    data-testid="input-file-upload"
                  />
                  <Upload size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-medium text-foreground mb-2">Upload Excel or CSV File</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Drop your <span className="text-primary font-medium">.xlsx</span>, <span className="text-primary font-medium">.xls</span>, or <span className="text-primary font-medium">.csv</span> file here. Headers are automatically detected — including Arabic column names.
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-3">Supported: Excel 97–2019, Excel 365, CSV (comma-separated)</p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium mb-2">Map Columns</h3>
                <p className="text-sm text-muted-foreground">Auto-detected headers. Adjust the mapping below if needed.</p>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {rawHeaders.map((header, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="flex-1 font-medium text-sm">
                        {header}
                        <span className="text-xs text-muted-foreground block font-normal mt-0.5">Sample: {rawData[0]?.[idx] || 'N/A'}</span>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <Select value={mappings[idx] || 'ignore'} onValueChange={(v) => setMappings({ ...mappings, [idx]: v })}>
                          <SelectTrigger className="bg-background border-white/10 text-sm h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">-- Ignore Column --</SelectItem>
                            {cfg.fields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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
                <h3 className="text-xl font-medium">Preview Data</h3>
                <p className="text-sm text-muted-foreground">Review a sample of how the data will appear.</p>
                <div className="rounded-md border border-white/10 overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/10">
                        {cfg.fields.map(f => <TableHead key={f} className="capitalize text-muted-foreground text-xs">{f}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPreviewData().map((row, i) => (
                        <TableRow key={i} className="border-white/10">
                          {cfg.fields.map(f => (
                            <TableCell key={f} className="text-xs">{row[f] || <span className="text-muted-foreground/50">-</span>}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-sm text-muted-foreground">Showing {Math.min(5, rawData.length)} of {rawData.length} rows</div>
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
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(201,168,76,0.2)]"
                >
                  <CheckCircle2 size={48} className="text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Import Successful</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Successfully imported {rawData.length} records into the {cfg.label} module.
                    {type === 'payroll' && ' Net Salary was calculated automatically for each record.'}
                  </p>
                </div>
                <div className="flex justify-center gap-4 pt-4">
                  <Button variant="outline" onClick={() => { setStep(1); setRawData([]); setRawHeaders([]); }} className="bg-transparent border-white/10">
                    Import More
                  </Button>
                  <Button onClick={() => setLocation(redirectTarget)}>View {redirectLabel}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
