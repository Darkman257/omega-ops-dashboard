import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext, Employee, EmployeeClearanceItem } from '@/context/AppContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Building2, 
  Truck, 
  Banknote, 
  HardHat, 
  FileText,
  Lock,
  ShieldCheck,
  Ban,
  MapPin,
  Activity as ActivityIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EmployeeClearanceModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
}

const DEPT_ICONS: Record<string, any> = {
  'Admin': User,
  'Housing': Building2,
  'Fleet': Truck,
  'Payroll': Banknote,
  'Site': MapPin,
  'Safety': HardHat,
  'Documents': FileText
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  in_progress: { icon: ActivityIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  blocked: { icon: Ban, color: 'text-red-500', bg: 'bg-red-500/10' },
  cleared: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' }
};

export const EmployeeClearanceModal: React.FC<EmployeeClearanceModalProps> = ({
  employee,
  isOpen,
  onClose
}) => {
  const { employeeClearanceItems, updateClearanceItem, completeEmployeeClearance } = useAppContext();
  const [notes, setNotes] = useState('');

  const items = employeeClearanceItems.filter(i => i.staffId === employee.id);
  const isFullyCleared = items.length > 0 && items.every(i => i.status === 'cleared');

  const depts = Array.from(new Set(items.map(i => i.department)));

  const handleStatusUpdate = (itemId: string, status: 'cleared' | 'blocked' | 'in_progress') => {
    updateClearanceItem(itemId, { status, notes: notes || undefined });
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[700px] bg-[#0A0A0A] border-white/10 text-foreground p-0 overflow-hidden backdrop-blur-xl">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-xl">
                {employee.name.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight">{employee.name}</DialogTitle>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                  {employee.internalCode} • {employee.role}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={`
              ${employee.clearanceStatus === 'cleared' ? 'bg-green-500/10 text-green-500' : 
                employee.clearanceStatus === 'blocked' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'}
              border-white/10 px-3 py-1 uppercase tracking-widest text-[10px]
            `}>
              {employee.clearanceStatus}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-8">
            {/* Context Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Exit Reason</p>
                <p className="text-sm font-bold">{employee.exitReason || 'Not specified'}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-1">Exit Date</p>
                <p className="text-sm font-bold">{employee.exitDate || 'Pending'}</p>
              </div>
            </div>

            {/* Departments */}
            <div className="space-y-6">
              {depts.length > 0 ? depts.map(dept => (
                <div key={dept} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    {DEPT_ICONS[dept] ? React.createElement(DEPT_ICONS[dept], { size: 14, className: "text-primary" }) : <ShieldCheck size={14} className="text-primary" />}
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">{dept} Clearance</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {items.filter(i => i.department === dept).map(item => {
                      const config = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
                      const StatusIcon = config.icon;
                      return (
                        <div key={item.id} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                                <StatusIcon size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground/90">{item.itemTitle}</p>
                                {item.notes && <p className="text-[11px] text-muted-foreground mt-1">{item.notes}</p>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.status !== 'cleared' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleStatusUpdate(item.id, 'blocked')}
                                  >
                                    Block
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className="h-8 text-[10px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-500 text-white"
                                    onClick={() => handleStatusUpdate(item.id, 'cleared')}
                                  >
                                    Clear
                                  </Button>
                                </>
                              )}
                              {item.status === 'cleared' && (
                                <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase tracking-widest">
                                  <CheckCircle2 size={14} /> Cleared
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center border border-dashed border-white/10 rounded-xl">
                  <Clock className="mx-auto text-muted-foreground/20 mb-2" size={32} />
                  <p className="text-xs text-muted-foreground font-bold">Clearance items are being initialized...</p>
                </div>
              )}
            </div>
            
            {/* Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <FileText size={14} className="text-muted-foreground" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/80">Interaction Notes</h3>
              </div>
              <Textarea 
                placeholder="Add notes for the next clearance step or block reason..."
                className="bg-white/5 border-white/10 min-h-[100px] text-sm resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t border-white/10 bg-white/5">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            Close
          </Button>
          {isFullyCleared && employee.lifecycleStatus !== 'inactive' && (
            <Button 
              className="bg-primary text-black font-black uppercase tracking-widest gap-2 shadow-[0_0_15px_rgba(201,168,76,0.4)]"
              onClick={() => {
                completeEmployeeClearance(employee.id);
                onClose();
              }}
            >
              <ShieldCheck size={18} /> Complete Final Clearance
            </Button>
          )}
          {!isFullyCleared && (
            <Button disabled className="bg-white/5 text-muted-foreground font-black uppercase tracking-widest gap-2 border border-white/10 cursor-not-allowed">
              <Lock size={16} /> All Items Must Be Cleared
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
