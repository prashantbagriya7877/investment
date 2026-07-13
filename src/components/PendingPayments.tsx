import React, { useState } from 'react';
import { DollarSign, ArrowLeft, Plus } from 'lucide-react';
import { LedgerProfile } from '../types';
import { LedgerList } from './Ledger/LedgerList';
import { LedgerProfileView } from './Ledger/LedgerProfileView';

interface PendingPaymentsProps {
  user?: any;
  onNavigateToTab?: (tab: string) => void;
  // We keep the other props optional in case App.tsx still passes them,
  // even though we don't use them anymore.
  pendingPayments?: any;
  onAddPayment?: any;
  onEditPayment?: any;
  onDeletePayment?: any;
  
  bankAccounts?: any[];
  onAddGlobalTransaction?: (tx: any) => Promise<void>;
  onDeleteGlobalTransaction?: (id: string) => Promise<void>;
}

export default function PendingPayments({
  user,
  onNavigateToTab,
  bankAccounts,
  onAddGlobalTransaction,
  onDeleteGlobalTransaction
}: PendingPaymentsProps) {
  const [selectedProfile, setSelectedProfile] = useState<LedgerProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-3" id="payments-tab">
      
      {/* Header and Trigger button (Only show when NO profile is selected) */}
      {!selectedProfile && (
        <div className="flex md:flex-row flex-col justify-between items-start md:items-center gap-2 bg-white p-2 rounded-xl border border-slate-200/80">
          <div>
            <h2 className="text-[11px] font-bold text-slate-500 tracking-widest font-sans">
              Payment Ledger
            </h2>
            <p className="text-xl font-bold text-slate-900 tracking-tight font-sans mt-0.5">
              Outstanding Balances (Khata)
            </p>
            <p className="text-xs text-slate-450 mt-1 font-sans font-medium">
              Clear track of payments due or receivable, with date and alerts.
            </p>
          </div>
          
          <div className="flex shrink-0">
            <div className="flex flex-nowrap items-center gap-2">
              {onNavigateToTab && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab('recurring-bills')}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <DollarSign size={14} /> Auto-Bills
                </button>
              )}
              <button 
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-white px-3 py-1.5 rounded-md font-semibold text-xs transition-colors shadow-xs whitespace-nowrap"
              >
                <Plus size={14} /> New Record
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedProfile ? (
        <LedgerProfileView 
          profile={selectedProfile} 
          userId={user?.uid} 
          onBack={() => setSelectedProfile(null)}
          bankAccounts={bankAccounts}
          onAddGlobalTransaction={onAddGlobalTransaction}
          onDeleteGlobalTransaction={onDeleteGlobalTransaction}
        />
      ) : (
        <LedgerList 
          onSelectProfile={setSelectedProfile} 
          userId={user?.uid} 
          showAddForm={showAddForm}
          setShowAddForm={setShowAddForm}
        />
      )}

    </div>
  );
}
