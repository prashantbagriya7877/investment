import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  TrendingUp, 
  TrendingDown, 
  DollarSign 
} from 'lucide-react';
import { PendingPayment } from '../types';

interface PendingPaymentsProps {
  pendingPayments: PendingPayment[];
  onAddPayment: (p: Omit<PendingPayment, 'id' | 'userId'>) => Promise<void>;
  onEditPayment: (id: string, p: Partial<PendingPayment>) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
}

export default function PendingPayments({
  pendingPayments,
  onAddPayment,
  onEditPayment,
  onDeletePayment
}: PendingPaymentsProps) {

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<'owe' | 'owed'>('owe');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab View selectors (active/settled)
  const [activeTab, setActiveTab] = useState<'active' | 'settled'>('active');

  // Today boundary for calculations
  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Form submission matching Add or Edit actions
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive decimal amount.');
      return;
    }
    if (!person.trim()) {
      alert('Please enter the name of the person.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onEditPayment(editingId, {
          type,
          person: person.trim(),
          amount: parsedAmount,
          dueDate,
          notes: notes.trim() || undefined
        });
        setEditingId(null);
      } else {
        await onAddPayment({
          type,
          person: person.trim(),
          amount: parsedAmount,
          dueDate,
          completed: false,
          notes: notes.trim() || undefined
        });
      }
      setIsFormOpen(false);
      setPerson('');
      setAmount('');
      setNotes('');
      setDueDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error(err);
      alert('Error syncing payment to cloud. Verify security rules.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger editing action
  const startEdit = (p: PendingPayment) => {
    setEditingId(p.id);
    setType(p.type);
    setPerson(p.person);
    setAmount(p.amount.toString());
    setDueDate(p.dueDate);
    setNotes(p.notes || '');
    setIsFormOpen(true);
  };

  // Toggle mark as done
  const handleToggleCompleted = async (p: PendingPayment) => {
    try {
      await onEditPayment(p.id, { completed: !p.completed });
    } catch (err) {
      console.error(err);
      alert('Error updating status in Firestore.');
    }
  };

  // Aggregated Debt Summary Stats
  const stats = useMemo(() => {
    let totalOwe = 0; // Money we owe to others
    let totalOwed = 0; // Money others owe to us
    let activeOverdue = 0;

    pendingPayments.forEach(p => {
      if (!p.completed) {
        if (p.type === 'owe') {
          totalOwe += p.amount;
        } else {
          totalOwed += p.amount;
        }

        if (p.dueDate < todayStr) {
          activeOverdue += 1;
        }
      }
    });

    return {
      totalOwe,
      totalOwed,
      activeOverdue,
      netBalance: totalOwed - totalOwe
    };
  }, [pendingPayments, todayStr]);

  // Filtering list by current activeTab
  const filteredPayments = useMemo(() => {
    return pendingPayments
      .filter(p => activeTab === 'active' ? !p.completed : p.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [pendingPayments, activeTab]);

  return (
    <div className="space-y-3" id="payments-tab">
      
      {/* Header and Trigger button */}
      <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
        <div>
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans">Payment Ledger</h2>
          <p className="text-xl font-bold text-slate-900 tracking-tight font-sans mt-0.5">Outstanding Balances</p>
          <p className="text-xs text-slate-450 mt-1 font-sans font-medium">Clear track of payments due or receivable, with date and alerts.</p>
        </div>
        
        <button
          onClick={() => {
            setEditingId(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white px-1.5 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer"
          id="new-payment-button"
        >
          <Plus size={14} /> Record Balance
        </button>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Money you owe */}
        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans">I owe others</span>
            <span className="text-[10px] bg-red-50 text-red-700 px-1 py-0.5 rounded-full uppercase tracking-wider font-semibold scale-90">Debit Ledger</span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-slate-950 font-sans block">
              ₹{stats.totalOwe.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Money owed to you */}
        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans">Others owe me</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded-full uppercase tracking-wider font-semibold scale-90">Credit Ledger</span>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-slate-950 font-sans block">
              ₹{stats.totalOwed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Net Outstanding Balance */}
        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest font-sans">Net Balance</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded-full uppercase tracking-wider font-semibold scale-90 font-sans">Ledger</span>
          </div>
          <div className="mt-1">
            <span className={`text-2xl font-bold tracking-tight font-sans block ${stats.netBalance >= 0 ? 'text-slate-950' : 'text-rose-600'}`}>
              {stats.netBalance < 0 ? '-' : ''}₹{Math.abs(stats.netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* Slide-out Add/Edit form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white rounded-xl border border-slate-200/80 shadow-xs"
            id="payment-form-panel"
          >
            <form onSubmit={handleSubmit} className="p-2 space-y-2" id="payment-form">
              <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                <h3 className="font-bold text-slate-900 font-sans text-xs uppercase tracking-wider">
                  {editingId ? 'Edit Balance Record' : 'Record Outstanding Balance'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                
                {/* Owe / Owed type selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Ledger Classification</label>
                  <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-md border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setType('owe')}
                      className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${type === 'owe' ? 'bg-slate-950 text-white' : 'text-slate-650 hover:bg-slate-100'}`}
                      id="form-payment-owe-type"
                    >
                      I Owe
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('owed')}
                      className={`py-1 text-xs font-semibold rounded cursor-pointer transition-all ${type === 'owed' ? 'bg-slate-950 text-white' : 'text-slate-650 hover:bg-slate-100'}`}
                      id="form-payment-owed-type"
                    >
                      Owed to Me
                    </button>
                  </div>
                </div>

                {/* Target Person */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Name / Entity</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rachel, Amazon..."
                    value={person}
                    onChange={(e) => setPerson(e.target.value)}
                    className="w-full px-1 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans"
                    id="form-person-input"
                  />
                </div>

                {/* Due Amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-450 text-xs font-sans font-semibold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-1 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white font-mono transition-all"
                      id="form-payment-amount-input"
                    />
                  </div>
                </div>

                {/* Calendar Due Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-1 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-mono"
                    id="form-payment-duedate"
                  />
                </div>

              </div>

              {/* Optional Memo Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Memo Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. dinner bill, refunds..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-1 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans"
                  id="form-payment-notes"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-1 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-1 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-semibold text-xs rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-2 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-semibold rounded text-xs transition-colors disabled:opacity-40 cursor-pointer"
                  id="form-payment-submit"
                >
                  {isSubmitting ? 'Syncing...' : editingId ? 'Update Ledger' : 'Create Record'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Display & Interactive Tab Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden" id="payments-ledger-container">
        
        {/* Toggle Headings */}
        <div className="px-2 py-1.5 flex border-b border-slate-250/60 justify-between items-center bg-slate-50/40">
          <div className="flex bg-slate-100/80 p-0.5 rounded-md">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold rounded-sm cursor-pointer transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              id="active-tab-selector"
            >
              <Clock size={12} /> Active ({pendingPayments.filter(p => !p.completed).length})
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`flex items-center gap-1.5 px-1 py-1 text-[11px] font-bold rounded-sm cursor-pointer transition-all ${activeTab === 'settled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              id="settled-tab-selector"
            >
              <CheckCircle size={12} /> Settled ({pendingPayments.filter(p => p.completed).length})
            </button>
          </div>

          {activeTab === 'active' && stats.activeOverdue > 0 && (
            <span className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full border border-red-100 font-bold uppercase tracking-wider">
              <AlertTriangle size={11} /> {stats.activeOverdue} Overdue
            </span>
          )}
        </div>

        {/* Content list */}
        {filteredPayments.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-white">
            <p className="text-xs">No ledger entries match this state.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredPayments.map((p) => {
              const isOverdue = !p.completed && p.dueDate < todayStr;
              return (
                <div 
                  key={p.id} 
                  className={`p-2 flex md:flex-row flex-col justify-between items-start md:items-center gap-2 transition-all ${isOverdue ? 'bg-red-50/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    
                    {/* Tick box to settle outstanding right now */}
                    <button
                      onClick={() => handleToggleCompleted(p)}
                      className={`mt-1 h-4 w-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${p.completed ? 'bg-slate-950 border-slate-950 text-white' : 'border-slate-300 hover:border-slate-400 bg-white'}`}
                      title={p.completed ? 'Mark pending' : 'Mark settled'}
                    >
                      {p.completed && <CheckCircle size={11} />}
                    </button>

                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-slate-800 font-sans text-sm">
                          {p.type === 'owe' ? 'Pay to: ' : 'Collect from: '} <span className="text-slate-950 font-bold">{p.person}</span>
                        </span>
                        {p.type === 'owe' ? (
                          <span className="bg-slate-150 text-slate-700 text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                            I Owe
                          </span>
                        ) : (
                          <span className="bg-slate-950 text-white text-[9px] px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                            Claim
                          </span>
                        )}
                      </div>

                      {p.notes && <p className="text-xs text-slate-500 mt-1">{p.notes}</p>}

                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-450 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> Due Date: {p.dueDate}
                        </span>
                        {isOverdue && (
                          <span className="text-red-500 font-bold flex items-center gap-1 text-[11px]">
                            <AlertTriangle size={11} /> Overdue!
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 h-6">
                      {!p.completed && (
                        <button
                          onClick={() => startEdit(p)}
                          className="p-1 text-slate-400 hover:text-slate-950 rounded transition-colors cursor-pointer"
                          title="Edit log details"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete outstanding balance ledger entry?')) {
                            onDeletePayment(p.id).catch(console.error);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-650 rounded transition-colors cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
