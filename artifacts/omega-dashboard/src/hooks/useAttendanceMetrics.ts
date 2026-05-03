// ─── useAttendanceMetrics ─────────────────────────────────────────────────────
// Fetches today's attendance records from Supabase.
// Returns real present/absent/sick/offsite counts.
// Falls back to null if the attendance table is empty or unavailable.
// Dashboard uses this to override the staff.status count when data is live.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AttendanceMetrics {
  present: number;
  absent: number;
  excusedAbsence: number;
  sick: number;
  offsite: number;
  nightShift: number;
  total: number;
  hasLiveData: boolean;
  date: string;
}

const EMPTY_METRICS: AttendanceMetrics = {
  present: 0,
  absent: 0,
  excusedAbsence: 0,
  sick: 0,
  offsite: 0,
  nightShift: 0,
  total: 0,
  hasLiveData: false,
  date: ''
};

export function useAttendanceMetrics(): AttendanceMetrics {
  const [metrics, setMetrics] = useState<AttendanceMetrics>(EMPTY_METRICS);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    supabase
      .from('attendance')
      .select('status')
      .eq('date', today)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          // Table may not exist or no data today — silent fallback
          setMetrics({ ...EMPTY_METRICS, hasLiveData: false, date: today });
          return;
        }

        const counts = {
          present: 0,
          absent: 0,
          excusedAbsence: 0,
          sick: 0,
          offsite: 0,
          nightShift: 0
        };

        for (const row of data) {
          switch (row.status) {
            case 'present':       counts.present++;       break;
            case 'absent':        counts.absent++;        break;
            case 'excused_absence': counts.excusedAbsence++; break;
            case 'sick':          counts.sick++;          break;
            case 'offsite':       counts.offsite++;       break;
            case 'night_shift':   counts.nightShift++;    break;
            // rest_day, off, transferred, permitted_leave → not counted as on-duty
          }
        }

        setMetrics({
          ...counts,
          total: data.length,
          hasLiveData: true,
          date: today
        });
      });
  }, []); // Run once on mount; add date dependency if you need real-time refresh

  return metrics;
}
