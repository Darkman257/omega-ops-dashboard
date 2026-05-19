import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck, AlertCircle, ShieldCheck, FileSpreadsheet,
  Clock, CheckCircle2, Info, Upload, Hash, User, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Static rule lists — no DB, no imports, no fake data ─────────────────────

const REQUIRED_COLUMNS = [
  {
    icon: Hash,
    label: 'Employee Code',
    field: 'Column 3 (index 3)',
    note: 'Must match staff.internal_code exactly. No name-only fallback.',
    critical: true,
  },
  {
    icon: User,
    label: 'Employee Name',
    field: 'Column 1 (index 1)',
    note: 'Used for display and warning messages only. Never used for matching.',
    critical: false,
  },
  {
    icon: Calendar,
    label: 'Day Columns (May 1 – 19)',
    field: 'Columns 10 → 28 (0-indexed)',
    note: 'Each column maps to one calendar day. Arabic status codes accepted (√, ج, ليلى, غياب بإذن…).',
    critical: true,
  },
  {
    icon: FileSpreadsheet,
    label: 'Position / Job Title',
    field: 'Column 2 (index 2)',
    note: 'Optional. Used to update staff.job_title on first upsert.',
    critical: false,
  },
];

const SAFETY_RULES = [
  {
    icon: ShieldCheck,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Dry Run First — Always',
    desc: 'Run without --push to preview parsed records, warnings, and unrecognized codes before committing any data to Supabase.',
  },
  {
    icon: Hash,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Code-Only Matching',
    desc: 'Staff are matched exclusively by internal_code (column 3). Name-only matching is blocked. Records without a valid code are skipped with a warning.',
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Duplicate Guard — Triple Key',
    desc: 'Upsert conflict key: employee_id + date + import_batch_id. Re-importing the same file is safely idempotent. Identical file hash is rejected automatically.',
  },
  {
    icon: CalendarCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Runtime Event After Import',
    desc: 'On successful push, an attendance_imported event will be emitted to the Runtime Timeline with batch ID, record count, and import timestamp.',
  },
];

const STATUS_CODES: { code: string; meaning: string; stored: string }[] = [
  { code: '√',             meaning: 'Present',            stored: 'present' },
  { code: 'ج',             meaning: 'Absent',             stored: 'absent' },
  { code: 'غياب بإذن',    meaning: 'Excused absence',    stored: 'excused_absence' },
  { code: 'إذن',           meaning: 'Permitted leave',    stored: 'permitted_leave' },
  { code: 'ليلى / ليلي',  meaning: 'Night shift',        stored: 'night_shift' },
  { code: 'مرضى',          meaning: 'Sick',               stored: 'sick' },
  { code: 'بنك',           meaning: 'Offsite / Bank',     stored: 'offsite' },
  { code: 'بدل راحة',      meaning: 'Compensatory',       stored: 'compensatory' },
  { code: 'نقل',           meaning: 'Transferred',        stored: 'transferred' },
  { code: '(empty)',        meaning: 'Day off / Weekend',  stored: 'off (skipped)' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Attendance() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 max-w-5xl mx-auto"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0F1319] via-[#0A0B0E] to-[#0D0E12] border border-white/5 px-6 pt-6 pb-7">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 40%, hsl(180 80% 45% / 0.18) 0%, transparent 60%)' }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <CalendarCheck size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground leading-none">
                Attendance
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Workforce attendance import and runtime verification
              </p>
            </div>
          </div>
          <Badge className="self-start sm:self-center bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 gap-1.5">
            <Clock size={11} />
            Import file pending
          </Badge>
        </div>
      </div>

      {/* ── May 1–19 Readiness ────────────────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/8 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Calendar size={13} className="text-amber-400" />
            May 1 – 19 Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-200">Awaiting file upload</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                No attendance records have been imported from this screen yet.
                The import pipeline is ready and standing by — provide the Excel
                or CSV export from the attendance sheet to proceed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Import period',   value: 'May 1 – 19, 2026',   color: 'text-cyan-400' },
              { label: 'Records in DB',   value: 'Not yet imported',    color: 'text-amber-400' },
              { label: 'Import batch ID', value: 'import_2026_05',      color: 'text-muted-foreground font-mono text-[11px]' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">
                  {item.label}
                </p>
                <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Disabled upload placeholder */}
          <div className="mt-2 border-2 border-dashed border-white/8 rounded-xl p-10 text-center relative">
            <Upload size={36} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground/60">Upload attendance file</p>
            <p className="text-xs text-muted-foreground/40 mt-1">
              .xlsx / .xls / .csv · Import pipeline not yet active
            </p>
            <Button
              disabled
              variant="outline"
              className="mt-4 border-white/10 text-muted-foreground/50 cursor-not-allowed opacity-50"
            >
              <Upload size={14} className="mr-2" />
              Select File
            </Button>
            <p className="text-[10px] text-muted-foreground/30 mt-3">
              Importer will be enabled in Phase 1. No data is written from this screen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Required Format ───────────────────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/8 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <FileSpreadsheet size={13} className="text-cyan-400" />
            Required Excel / CSV Format
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            The importer expects a monthly attendance sheet exported from Google Sheets or Excel.
            Column positions are fixed (0-indexed). Arabic column headers are supported.
          </p>
          <div className="space-y-2">
            {REQUIRED_COLUMNS.map(col => (
              <div
                key={col.label}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  col.critical
                    ? 'bg-cyan-500/5 border-cyan-500/15'
                    : 'bg-white/[0.02] border-white/8'
                }`}
              >
                <div className={`p-1.5 rounded-md shrink-0 ${col.critical ? 'bg-cyan-500/10' : 'bg-white/5'}`}>
                  <col.icon size={13} className={col.critical ? 'text-cyan-400' : 'text-muted-foreground'} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{col.label}</span>
                    <code className="text-[10px] font-mono text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                      {col.field}
                    </code>
                    {col.critical && (
                      <Badge className="text-[9px] bg-cyan-500/10 border-cyan-500/20 text-cyan-400 font-bold uppercase">
                        Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{col.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Status code reference */}
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
              Recognised Arabic Status Codes
            </p>
            <div className="rounded-lg border border-white/8 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Sheet value</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Meaning</th>
                    <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Stored as</th>
                  </tr>
                </thead>
                <tbody>
                  {STATUS_CODES.map((row, i) => (
                    <tr key={row.code} className={`border-b border-white/5 last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-3 py-2 font-mono text-amber-300" dir="rtl">{row.code}</td>
                      <td className="px-3 py-2 text-foreground">{row.meaning}</td>
                      <td className="px-3 py-2 font-mono text-emerald-400/80 text-[11px]">{row.stored}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Import Safety Rules ───────────────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/8 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ShieldCheck size={13} className="text-emerald-400" />
            Import Safety Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAFETY_RULES.map(rule => (
            <div key={rule.title} className={`rounded-xl border p-4 ${rule.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <rule.icon size={14} className={rule.color} />
                <span className="text-sm font-bold text-foreground">{rule.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Pipeline Command Reference ─────────────────────────────────────── */}
      <Card className="bg-white/[0.03] border-white/8 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Info size={13} className="text-muted-foreground" />
            CLI Pipeline Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Import is executed via the secure Node.js CLI pipeline — not from the browser.
            The UI importer will be enabled in Phase 1 after the first successful dry run.
          </p>
          <div className="space-y-2">
            {[
              {
                step: '1 · Dry run',
                cmd: 'pnpm --filter @workspace/omega-dashboard run import-attendance -- ./data/may.csv 2026 5',
                note: 'Parses and validates the file. No writes. Shows counts, warnings, and unrecognised codes.',
                color: 'border-cyan-500/20 bg-cyan-500/5',
                badge: 'bg-cyan-500/10 text-cyan-400',
              },
              {
                step: '2 · Push',
                cmd: 'pnpm --filter @workspace/omega-dashboard run import-attendance -- ./data/may.csv 2026 5 --push',
                note: 'Writes staff upserts + attendance records to Supabase. Duplicate guard active.',
                color: 'border-emerald-500/20 bg-emerald-500/5',
                badge: 'bg-emerald-500/10 text-emerald-400',
              },
              {
                step: '3 · Verify',
                cmd: 'pnpm --filter @workspace/omega-dashboard run verify-attendance 2026 5',
                note: 'Reads back imported records from Supabase and prints summary totals per status.',
                color: 'border-amber-500/20 bg-amber-500/5',
                badge: 'bg-amber-500/10 text-amber-400',
              },
            ].map(item => (
              <div key={item.step} className={`rounded-xl border p-4 space-y-2 ${item.color}`}>
                <div className="flex items-center gap-2">
                  <Badge className={`text-[9px] font-black uppercase ${item.badge} border-0`}>
                    {item.step}
                  </Badge>
                </div>
                <code className="block text-[11px] font-mono text-foreground/80 bg-black/40 px-3 py-2 rounded-lg break-all leading-relaxed">
                  {item.cmd}
                </code>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Footer note ───────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="text-foreground font-semibold">Phase 0 complete.</span>{' '}
          Import pipeline infrastructure is verified and ready.
          This page will be updated with live attendance counts and a browser upload panel in Phase 1
          once the May file has been successfully imported via CLI dry run.
        </p>
      </div>
    </motion.div>
  );
}
