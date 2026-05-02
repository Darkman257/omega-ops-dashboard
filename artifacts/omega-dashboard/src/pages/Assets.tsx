import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Search, Wrench, CheckCircle2, AlertTriangle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Asset {
  id: string;
  name: string;
  category: string;
  status: string;
  value: number;
  location: string;
  serial_number: string;
  purchase_date: string;
  notes: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusColor: Record<string, string> = {
  Active: 'bg-green-500/15 text-green-400 border-green-500/30',
  Maintenance: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Retired: 'bg-red-500/15 text-red-400 border-red-500/30',
  'In Use': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    supabase.from('assets').select('*')
      .then(({ data, error }) => {
        if (error) console.warn('[assets]', error.message);
        if (data) setAssets(data as Asset[]);
        setLoading(false);
      });
  }, []);

  const filtered = assets.filter(a => {
    const matchSearch = a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.category?.toLowerCase().includes(search.toLowerCase()) ||
      a.location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = assets.reduce((s, a) => s + Number(a.value ?? 0), 0);
  const activeCount = assets.filter(a => a.status === 'Active' || a.status === 'In Use').length;
  const maintenanceCount = assets.filter(a => a.status === 'Maintenance').length;

  return (
    <motion.div className="space-y-6" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }}>
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Asset Vault</h1>
        <p className="text-muted-foreground text-sm mt-1">Equipment, tools, and company asset registry</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Assets', value: assets.length, icon: Package, color: 'text-blue-400' },
          { label: 'Total Value', value: formatCurrency(totalValue), icon: DollarSign, color: 'text-primary' },
          { label: 'Active', value: activeCount, icon: CheckCircle2, color: 'text-green-400' },
          { label: 'In Maintenance', value: maintenanceCount, icon: Wrench, color: 'text-yellow-400' },
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
            placeholder="Search assets..."
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
            {['All', 'Active', 'In Use', 'Maintenance', 'Retired'].map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {loading ? (
        <motion.div variants={itemVariants} className="text-center py-20 text-muted-foreground">Loading assets...</motion.div>
      ) : filtered.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-20">
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">No assets found</p>
          <p className="text-muted-foreground/60 text-sm mt-1">Assets will appear here once added to the assets table in Supabase</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(asset => (
            <Card key={asset.id} className="bg-white/5 border-white/10 backdrop-blur-sm hover:border-white/20 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                    {asset.category && <p className="text-xs text-muted-foreground mt-0.5">{asset.category}</p>}
                  </div>
                  <Badge className={`text-xs border ${statusColor[asset.status] ?? 'bg-white/10 text-white/70 border-white/20'}`}>
                    {asset.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {asset.value > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Value</span>
                    <span className="font-medium text-primary">{formatCurrency(asset.value)}</span>
                  </div>
                )}
                {asset.location && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span>{asset.location}</span>
                  </div>
                )}
                {asset.serial_number && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">S/N</span>
                    <span className="font-mono text-xs">{asset.serial_number}</span>
                  </div>
                )}
                {asset.purchase_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchased</span>
                    <span>{asset.purchase_date}</span>
                  </div>
                )}
                {asset.notes && (
                  <p className="text-xs text-muted-foreground border-t border-white/5 pt-2">{asset.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
