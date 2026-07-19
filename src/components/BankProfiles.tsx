import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit2, X, Building2, Wallet, Landmark, TrendingUp, TrendingDown, ArrowRight, ArrowLeftRight, ChevronRight, ArrowDownRight, ArrowUpRight, Save, Search, Calendar, Filter } from 'lucide-react';
import { BankAccount, Transaction } from '../types';

interface BankProfilesProps {
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  onAddBankAccount: (acc: Omit<BankAccount, 'id' | 'userId' | 'currentBalance'>) => Promise<void>;
  onEditBankAccount: (id: string, updates: Partial<BankAccount>) => Promise<void>;
  onDeleteBankAccount: (id: string) => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export default function BankProfiles({
  bankAccounts,
  transactions,
  onAddBankAccount,
  onEditBankAccount,
  onDeleteBankAccount,
  onNavigateToTab
}: BankProfilesProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiIdsText, setUpiIdsText] = useState(''); // comma separated
  const [initialBalance, setInitialBalance] = useState('');

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const openAddForm = () => {
    setEditingBank(null);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiIdsText('');
    setInitialBalance('');
    setIsFormOpen(true);
  };

  const openEditForm = (bank: BankAccount, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click from navigating
    setEditingBank(bank);
    setBankName(bank.bankName);
    setAccountName(bank.accountName);
    setAccountNumber(bank.accountNumber || '');
    setIfscCode(bank.ifscCode || '');
    setUpiIdsText(bank.upiIds?.join(', ') || '');
    setInitialBalance(String(bank.initialBalance ?? bank.currentBalance));
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBank(null);
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setIfscCode('');
    setUpiIdsText('');
    setInitialBalance('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const balanceNum = parseFloat(initialBalance);
    if (isNaN(balanceNum)) return;

    const upiArray = upiIdsText.split(',').map(u => u.trim()).filter(Boolean);

    if (editingBank) {
      // Edit mode — only update name/label/accountNumber fields, not balance
      await onEditBankAccount(editingBank.id, {
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() || undefined,
        upiIds: upiArray.length > 0 ? upiArray : undefined
      });
    } else {
      // Add mode
      const accPayload: Omit<BankAccount, 'id' | 'userId' | 'currentBalance'> = {
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        initialBalance: balanceNum
      };
      if (accountNumber.trim()) {
        accPayload.accountNumber = accountNumber.trim();
      }
      if (ifscCode.trim()) {
        accPayload.ifscCode = ifscCode.trim();
      }
      if (upiArray.length > 0) {
        accPayload.upiIds = upiArray;
      }
      await onAddBankAccount(accPayload);
    }

    closeForm();
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId);
  
  const filteredTransactions = React.useMemo(() => {
    if (!selectedBankId) return [];
    let list = transactions.filter(t => t.bankAccountId === selectedBankId).sort((a, b) => b.date.localeCompare(a.date));
    
    const isSearchingOrFiltering = searchQuery.trim() !== '' || filterType !== 'all' || startDate !== '' || endDate !== '';
    
    if (searchQuery.trim()) {
      const lowerQ = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.category.toLowerCase().includes(lowerQ) || 
        (t.notes && t.notes.toLowerCase().includes(lowerQ))
      );
    }
    
    if (filterType !== 'all') {
      list = list.filter(t => t.type === filterType);
    }

    if (startDate) {
      list = list.filter(t => t.date >= startDate);
    }
    
    if (endDate) {
      list = list.filter(t => t.date <= endDate);
    }
    
    if (!isSearchingOrFiltering) {
      return list.slice(0, 10);
    }
    
    return list;
  }, [transactions, selectedBankId, searchQuery, filterType, startDate, endDate]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 mb-2">
        <p className="text-lg sm:text-xl font-black text-slate-900 font-sans tracking-tight flex items-center gap-2 capitalize">
          <Building2 size={20} className="text-slate-800 shrink-0" />
          Bank Profiles
        </p>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {onNavigateToTab && (
            <button
              type="button"
              onClick={() => onNavigateToTab('transactions')}
              className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeftRight size={14} /> Journal Ledger
            </button>
          )}
          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} /> Add Bank
          </button>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xl relative"
          >
            <button
              onClick={closeForm}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="font-bold text-slate-900 font-sans text-xs tracking-wider mb-3 flex items-center gap-1.5">
              {editingBank ? <><Edit2 size={14} className="text-slate-800" /> Edit Bank Profile</> : <><Plus size={14} className="text-slate-800" /> Add New Bank Account</>}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">Bank Name</label>
                <input required placeholder="e.g. HDFC, SBI" value={bankName} onChange={e => setBankName(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">Account Label</label>
                <input required placeholder="e.g. Primary Savings" value={accountName} onChange={e => setAccountName(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">A/C Number (Last 4 digits)</label>
                <input placeholder="e.g. 1234 (Optional)" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">IFSC Code</label>
                <input placeholder="e.g. HDFC0001234 (Optional)" value={ifscCode} onChange={e => setIfscCode(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">UPI IDs (Comma separated)</label>
                <input placeholder="e.g. user@upi, 9876543210@paytm" value={upiIdsText} onChange={e => setUpiIdsText(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-sans" />
              </div>
              {!editingBank && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 tracking-widest block font-sans mb-1">Initial Balance (₹)</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-250 rounded-md focus:outline-hidden bg-white transition-all font-mono" />
                </div>
              )}
              {editingBank && (
                <div className="flex items-end">
                  <p className="text-[10px] text-slate-500 italic font-sans">Current balance is auto-managed by transactions. Edit the initial balance via a manual correction transaction.</p>
                </div>
              )}
              <div className="md:col-span-2 pt-2">
                <button type="submit" className="w-full px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white font-semibold rounded text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                  <Save size={14} /> {editingBank ? 'Save Changes' : 'Save Bank Account'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Bank Cards */}
      {!selectedBankId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bankAccounts.length === 0 ? (
            <div className="col-span-full py-10 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl">
              <Landmark size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No bank profiles added yet.</p>
              <button onClick={openAddForm} className="mt-3 text-slate-900 font-bold text-xs hover:underline cursor-pointer">+ Add your first bank</button>
            </div>
          ) : (
            bankAccounts.map(b => (
              <motion.div 
                whileHover={{ y: -2, scale: 1.01 }}
                key={b.id} 
                onClick={() => setSelectedBankId(b.id)}
                className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                  <Landmark size={80} className="transform translate-x-4 -translate-y-4" />
                </div>
                
                <div className="flex justify-between items-start relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-700 shadow-inner">
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg leading-tight">{b.bankName}</h4>
                      <p className="text-xs text-slate-500 font-medium">{b.accountName} {b.accountNumber ? `(..${b.accountNumber})` : ''}</p>
                      {b.upiIds && b.upiIds.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate max-w-[150px]">UPI: {b.upiIds[0]}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => openEditForm(b, e)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit profile"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100/80 flex justify-between items-end relative z-10">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Balance</p>
                    <p className="text-2xl font-black text-slate-900 font-mono tracking-tight mt-0.5">₹{b.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Specific Bank History View */}
      {selectedBankId && selectedBank && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40 overflow-hidden"
        >
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white flex justify-between items-center rounded-t-2xl relative overflow-hidden">
            {/* Background design */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            <div className="relative z-10">
              <button onClick={() => setSelectedBankId(null)} className="text-slate-300 hover:text-white text-xs font-bold mb-2 flex items-center gap-1.5 cursor-pointer transition-colors">
                <ArrowLeftRight size={12} className="rotate-90" /> Back to Profiles
              </button>
              <h3 className="text-xl font-black flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-xs">
                  <Landmark size={20} className="text-white" />
                </div>
                {selectedBank.bankName} - {selectedBank.accountName}
              </h3>
            </div>
            <div className="text-right relative z-10">
              <p className="text-[10px] text-slate-300 capitalize font-medium tracking-widest mb-1">Live Balance</p>
              <p className="text-2xl font-mono font-black drop-shadow-sm">₹{selectedBank.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="p-0">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 capitalize tracking-widest">passbook history</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditForm(selectedBank, e as any);
                    setSelectedBankId(null);
                  }}
                  className="text-slate-700 hover:text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 size={12} /> Edit Profile
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this bank profile? Transactions will not be deleted but will lose linkage.')) {
                      await onDeleteBankAccount(selectedBank.id);
                      setSelectedBankId(null);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={12} /> Remove Profile
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center">
               <div className="flex gap-2 flex-1">
                 <div className="relative flex-1">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Search size={14} className="text-slate-400" />
                   </div>
                   <input 
                     type="text"
                     placeholder="Search notes/category..."
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs transition-all outline-hidden"
                   />
                 </div>
                 <div className="relative w-28 shrink-0">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Filter size={14} className="text-slate-400" />
                   </div>
                   <select
                     value={filterType}
                     onChange={e => setFilterType(e.target.value)}
                     className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs transition-all outline-hidden appearance-none"
                   >
                     <option value="all">All</option>
                     <option value="income">Income</option>
                     <option value="expense">Expense</option>
                   </select>
                   <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                     <ChevronRight size={12} className="text-slate-400 rotate-90" />
                   </div>
                 </div>
               </div>
               <div className="flex gap-2 shrink-0">
                 <div className="relative">
                   <input 
                     type="date"
                     value={startDate}
                     onChange={e => setStartDate(e.target.value)}
                     className="pl-3 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs transition-all outline-hidden text-slate-600"
                     title="Start Date"
                   />
                 </div>
                 <div className="relative">
                   <input 
                     type="date"
                     value={endDate}
                     onChange={e => setEndDate(e.target.value)}
                     className="pl-3 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-xs transition-all outline-hidden text-slate-600"
                     title="End Date"
                   />
                 </div>
               </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p className="text-center text-slate-700 py-8 text-sm">No transactions found.</p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                {filteredTransactions.map(t => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={t.id} 
                    className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors group cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200/50' : 'bg-red-100 text-red-600 border border-red-200/50'}`}>
                        {t.type === 'income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{t.category}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px] md:max-w-sm mt-0.5">{t.notes || 'No description'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold text-base ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">{t.date}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
