import { Transaction } from '../types';

/**
 * Utility to convert transactions lists into a valid downloadable CSV string
 */
export function exportTransactionsToCSV(transactions: Transaction[]) {
  if (transactions.length === 0) {
    alert("No transactions log available to export!");
    return;
  }

  // Define headers matching our entity schemas
  const headers = ['ID', 'Type', 'Category', 'Amount', 'Date', 'Notes'];
  
  // Format rows
  const rows = transactions.map(t => [
    t.id,
    t.type.toUpperCase(),
    // Escape quotes/commas for CSV compliance
    `"${t.category.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    t.date,
    t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  // Create a blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const timestamp = new Date().toISOString().substring(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `financial_transactions_export_${timestamp}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
