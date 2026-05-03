import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckSquare, Search, Clock, CheckCircle2, XCircle,
  AlertCircle, User, Calendar, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Approval {
  id: string;
  title: string;
  type: string;
  status: string;
  requester: string;
  requested_date: string;
  reviewed_by: string;
  reviewed_date: string;
  notes: string;
  amount: number;
  linked_table?: string;
  linked_record_id?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  Pending:  { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: Clock },
  Approved: { color: 'bg-green-500/15 text-green-400 border-green-500/30', icon: CheckCircle2 },
  Rejected: { color: 'bg-red-500/15 text-red-400 border-red-500/30', icon: XCircle },
  'Under Review': { color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: AlertCircle },
};

export default function Approvals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    supabase.from('approvals').select('*')
      .then(({ data, error }) => {
        if (error) console.warn('[approvals]', error.message);
        if (data) setApprovals(data as Approval[]);
        setLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, newStatus: string, linkedTable?: string, linkedId?: string) => {
    const { error } = await supabase.from('approvals').update({
      status: newStatus,
      reviewed_date: new Date().toISOString().split('T')[0],
      reviewed_by: 'Admin'
    }).eq('id', id);
    
    if (!error) {
      setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      
      if (newStatus === 'Approved' && linkedTable && linkedId) {
        if (linkedTable === 'housing_assignments') {
           await supabase.from('housing_assignments').update({ assignment_status: 'linked' }).eq('id', linkedId);
        } else if (linkedTable === 'vehicles') {
           await supabase.from('vehicles').update({ assignment_status: 'linked' }).eq('id', linkedId);
        }
      }
    }
  };

  const filtered = approvals.filter(a => {
    const matchSearch =
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.requester?.toLowerCase().includes(search.toLowerCase()) ||
      a.type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    pending: approvals.filter(a => a.status === 'Pending').length,
    approved: approvals.filter(a => a.status === 'Approved').length,
    rejected: approvals.filter(a => a.status === 'Rejected').length,
    review: approvals.filter(a => a.status === 'Under Review').length,
  };

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">Requests, authorizations, and workflow approvals</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Pending', value: counts.pending, icon: Clock, color: 'text-yellow-400' },
          { label: 'Under Review', value: counts.review, icon: AlertCircle, color: 'text-blue-400' },
          { label: 'Approved', value: counts.approved, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'Rejected', value: counts.rejected, icon: XCircle, color: 'text-red-400' },
        ].map(kpi => (
          <Card key={kpi.label} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '—' : kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white/5 border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['All', 'Pending', 'Under Review', 'Approved', 'Rejected'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {loading ? (
        <motion.div variants={itemVariants} className="text-center py-20 text-muted-foreground">Loading approvals...</motion.div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <CheckSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No approvals found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Approval requests will appear here from the approvals table in Supabase</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {filtered.map(approval => {
            const cfg = statusConfig[approval.status] ?? statusConfig['Pending'];
            const StatusIcon = cfg.icon;
            return (
              <Card key={approval.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm truncate">{approval.title}</h3>
                        {approval.type && (
                          <Badge variant="outline" className="text-xs border-white/15 text-muted-foreground">{approval.type}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                        {approval.requester && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />{approval.requester}
                          </span>
                        )}
                        {approval.requested_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />{approval.requested_date}
                          </span>
                        )}
                        {approval.amount > 0 && (
                          <span className="text-primary font-medium">EGP {Number(approval.amount).toLocaleString()}</span>
                        )}
                      </div>
                      {approval.notes && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                          <FileText className="h-3 w-3 mt-0.5 shrink-0" />{approval.notes}
                        </p>
                      )}
                      {approval.reviewed_by && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reviewed by {approval.reviewed_by}{approval.reviewed_date ? ` on ${approval.reviewed_date}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={cn('text-xs border flex items-center gap-1', cfg.color)}>
                        <StatusIcon className="h-3 w-3" />{approval.status}
                      </Badge>
                      {(approval.status === 'Pending' || approval.status === 'Under Review') && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 text-xs"
                            onClick={() => updateStatus(approval.id, 'Approved', approval.linked_table, approval.linked_record_id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                            onClick={() => updateStatus(approval.id, 'Rejected', approval.linked_table, approval.linked_record_id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
