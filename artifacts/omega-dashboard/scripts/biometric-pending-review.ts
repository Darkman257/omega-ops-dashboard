// ─── Biometric Pending Review Report ──────────────────────────────────────────
// Generates a report of biometric identities that are NOT confirmed in the
// staff table. These are classified as "pending_review".
//
// Usage:
//   pnpm --filter @workspace/omega-dashboard run pending-biometrics
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SEP      = '━'.repeat(90);

console.log(`\n${SEP}`);
console.log(`  OMEGA — BIOMETRIC IDENTITIES PENDING REVIEW`);
console.log(`  Time: ${new Date().toISOString()}`);
console.log(`${SEP}\n`);

// 1. Fetch staff codes
const { data: staffData, error: staffErr } = await supabase
  .from('staff')
  .select('internal_code');

if (staffErr) {
  console.error(`  ✗ Staff fetch failed: ${staffErr.message}`);
  process.exit(1);
}

const staffCodes = new Set<string>();
for (const s of staffData ?? []) {
  staffCodes.add(String(s.internal_code ?? ''));
}

// 2. Fetch all biometric logs
console.log(`  Fetching biometric logs...`);
const { data: logData, error: logErr } = await supabase
  .from('attendance_logs')
  .select('employee_id, employee_name, log_date');

if (logErr) {
  console.error(`  ✗ Logs fetch failed: ${logErr.message}`);
  process.exit(1);
}

interface PendingBio {
  code: string;
  name: string;
  first_seen: string;
  latest_seen: string;
  scan_count: number;
}

const pendingMap = new Map<string, PendingBio>();

for (const row of logData ?? []) {
  const code = String(row.employee_id).trim();
  if (!code || staffCodes.has(code)) continue;

  const logDate = row.log_date;
  const existing = pendingMap.get(code);

  if (!existing) {
    pendingMap.set(code, {
      code,
      name: (row.employee_name ?? '').trim() || 'Unknown',
      first_seen: logDate,
      latest_seen: logDate,
      scan_count: 1
    });
  } else {
    // Update name if longer
    const newName = (row.employee_name ?? '').trim();
    if (newName.length > existing.name.length) {
      existing.name = newName;
    }
    // Update dates
    if (logDate < existing.first_seen) existing.first_seen = logDate;
    if (logDate > existing.latest_seen) existing.latest_seen = logDate;
    // Update count
    existing.scan_count++;
  }
}

const results = [...pendingMap.values()].sort((a, b) => Number(a.code) - Number(b.code));

console.log(`\n  Found ${results.length} unconfirmed biometric identities.\n`);

console.log(`  ${'Code'.padEnd(10)}${'Biometric Name'.padEnd(25)}${'First Seen'.padEnd(15)}${'Latest Seen'.padEnd(15)}Scans`);
console.log(`  ${'─'.repeat(75)}`);

for (const p of results) {
  console.log(
    `  ${p.code.padEnd(10)}` +
    `${p.name.slice(0, 23).padEnd(25)}` +
    `${p.first_seen.padEnd(15)}` +
    `${p.latest_seen.padEnd(15)}` +
    `${String(p.scan_count).padStart(5)}`
  );
}

console.log(`\n${SEP}`);
console.log(`  ℹ️  Note: Biometric code exists but not confirmed in staff/payroll.`);
console.log(`     These may be new workers, temporary labor, or misconfigured machines.`);
console.log(`     Do NOT auto-import without HR verification.`);
console.log(`${SEP}\n`);
