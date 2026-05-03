import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Check, DollarSign, Calendar, FileText, Trash2 } from 'lucide-react';

export default function ContractsFlow() {
  const { 
    contracts, payments,
    addContract, updateContract, deleteContract,
    addPayment, deletePayment
  } = useAppContext();

  // Contracts Form State
  const [unitNumber, setUnitNumber] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractNotes, setContractNotes] = useState('');
  const [contractStatus, setContractStatus] = useState<'Active' | 'Expired'>('Active');

  // Payments Form State
  const [selectedContractId, setSelectedContractId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Pending'>('Paid');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // KPIs
  const totalRent = contracts.reduce((acc, cur) => acc + (cur.rentAmount || 0), 0);
  const collectedRent = payments.filter(p => p.status === 'Paid').reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const pendingRent = Math.max(0, totalRent - collectedRent);

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber || !tenantName || !rentAmount) return;
    addContract({
      unitNumber,
      tenantName,
      rentAmount: parseFloat(rentAmount),
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: contractStatus,
      notes: contractNotes,
    });
    setUnitNumber('');
    setTenantName('');
    setRentAmount('');
    setContractNotes('');
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !paymentAmount) return;
    addPayment({
      contractId: selectedContractId,
      amount: parseFloat(paymentAmount),
      status: paymentStatus,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      notes: paymentNotes,
    });
    setPaymentAmount('');
    setPaymentNotes('');
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/60 backdrop-blur-3xl border-white/10 relative overflow-hidden group">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Total Contract Rent / إجمالي قيمة الإيجار
              </div>
              <div className="text-3xl font-black neon-text-gold tracking-tight">
                ${totalRent.toLocaleString()}
              </div>
            </div>
            <FileText className="text-primary group-hover:scale-110 transition-transform" size={28} />
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-3xl border-white/10 relative overflow-hidden group">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Collected Payments / المحصل
              </div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                ${collectedRent.toLocaleString()}
              </div>
            </div>
            <Check className="text-emerald-400 group-hover:scale-110 transition-transform" size={28} />
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-3xl border-white/10 relative overflow-hidden group">
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Pending / المتبقي
              </div>
              <div className="text-3xl font-black text-amber-500 tracking-tight">
                ${pendingRent.toLocaleString()}
              </div>
            </div>
            <DollarSign className="text-amber-500 group-hover:scale-110 transition-transform" size={28} />
          </CardContent>
        </Card>
      </div>

      {/* Forms & Tables Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* CONTRACTS FLOW */}
        <Card className="bg-black/40 border-white/10 glass-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-primary" size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest">Manage Contracts / إدارة العقود</h3>
            </div>

            {/* Create Contract Form */}
            <form onSubmit={handleCreateContract} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Unit Number / رقم الوحدة</label>
                <Input 
                  value={unitNumber} 
                  onChange={e => setUnitNumber(e.target.value)} 
                  placeholder="e.g. Unit 401" 
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Tenant Name / المستأجر</label>
                <Input 
                  value={tenantName} 
                  onChange={e => setTenantName(e.target.value)} 
                  placeholder="e.g. Al Sebaei Group" 
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Rent Amount / مبلغ الإيجار</label>
                <Input 
                  value={rentAmount} 
                  onChange={e => setRentAmount(e.target.value)} 
                  placeholder="e.g. 15000" 
                  type="number"
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Status / الحالة</label>
                <select 
                  value={contractStatus} 
                  onChange={e => setContractStatus(e.target.value as 'Active' | 'Expired')} 
                  className="flex h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-white focus:border-primary/50"
                >
                  <option value="Active">Active / ساري</option>
                  <option value="Expired">Expired / منتهي</option>
                </select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Notes / ملاحظات</label>
                <Input 
                  value={contractNotes} 
                  onChange={e => setContractNotes(e.target.value)} 
                  placeholder="Additional contract terms..." 
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50"
                />
              </div>
              <Button type="submit" className="h-9 sm:col-span-2 bg-primary hover:bg-primary/80 text-black font-black text-[10px] tracking-widest uppercase rounded-xl transition-all">
                <Plus size={16} className="mr-2" /> Add Contract / إضافة عقد
              </Button>
            </form>

            {/* Contracts Table */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-muted-foreground text-[10px] uppercase font-black tracking-wider">
                      <th className="p-3">Unit / الوحدة</th>
                      <th className="p-3">Tenant / المستأجر</th>
                      <th className="p-3">Rent / المبلغ</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contracts.map(c => (
                      <tr key={c.id} className="hover:bg-white/5 transition-all text-white/90">
                        <td className="p-3 font-bold">{c.unitNumber}</td>
                        <td className="p-3 font-medium">{c.tenantName}</td>
                        <td className="p-3 font-black neon-text-gold">${c.rentAmount}</td>
                        <td className="p-3">
                          <span 
                            onClick={() => updateContract(c.id, { status: c.status === 'Active' ? 'Expired' : 'Active' })}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                              c.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button 
                            onClick={() => deleteContract(c.id)}
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground tracking-widest text-[10px] uppercase italic">
                          No contracts found / لا توجد عقود
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PAYMENTS FLOW */}
        <Card className="bg-black/40 border-white/10 glass-card">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="text-emerald-400" size={20} />
              <h3 className="text-xs font-black uppercase tracking-widest">Record Payment / تحصيل المدفوعات</h3>
            </div>

            {/* Create Payment Form */}
            <form onSubmit={handleCreatePayment} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Select Contract / العقد</label>
                <select 
                  value={selectedContractId} 
                  onChange={e => setSelectedContractId(e.target.value)} 
                  className="flex h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-white focus:border-primary/50"
                  required
                >
                  <option value="">Choose Contract...</option>
                  {contracts.map(c => (
                    <option key={c.id} value={c.id}>{c.unitNumber} - {c.tenantName}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Amount / مبلغ الدفع</label>
                <Input 
                  value={paymentAmount} 
                  onChange={e => setPaymentAmount(e.target.value)} 
                  placeholder="e.g. 5000" 
                  type="number"
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50" 
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Status / الحالة</label>
                <select 
                  value={paymentStatus} 
                  onChange={e => setPaymentStatus(e.target.value as 'Paid' | 'Pending')} 
                  className="flex h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1 text-xs text-white focus:border-primary/50"
                >
                  <option value="Paid">Paid / مدفوع</option>
                  <option value="Pending">Pending / متبقي</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Payment Date / التاريخ</label>
                <Input 
                  value={paymentDate} 
                  onChange={e => setPaymentDate(e.target.value)} 
                  type="date"
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Notes / ملاحظات</label>
                <Input 
                  value={paymentNotes} 
                  onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder="Any details or receipt info..." 
                  className="h-9 text-xs bg-black/40 border-white/10 text-white rounded-lg focus:border-primary/50"
                />
              </div>
              <Button type="submit" className="h-9 sm:col-span-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] tracking-widest uppercase rounded-xl transition-all">
                <Plus size={16} className="mr-2" /> Record Payment / تسجيل دفعة
              </Button>
            </form>

            {/* Payments Table */}
            <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10 text-muted-foreground text-[10px] uppercase font-black tracking-wider">
                      <th className="p-3">Contract / العقد</th>
                      <th className="p-3">Amount / المبلغ</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map(p => {
                      const contractObj = contracts.find(c => c.id === p.contractId);
                      return (
                        <tr key={p.id} className="hover:bg-white/5 transition-all text-white/90">
                          <td className="p-3 font-medium">
                            {contractObj ? `${contractObj.unitNumber} (${contractObj.tenantName})` : 'Unknown Contract'}
                          </td>
                          <td className="p-3 font-black text-emerald-400">${p.amount}</td>
                          <td className="p-3">
                            <span 
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                p.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Button 
                              onClick={() => deletePayment(p.id)}
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground tracking-widest text-[10px] uppercase italic">
                          No payments recorded / لا توجد دفعات
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
