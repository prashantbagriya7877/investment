import { useState, useEffect, useCallback } from 'react';
import { Holding, WatchlistItem } from '../types';
import { fetchStockPrice, fetchMutualFundNav } from '../utils/financeHelpers';

export interface LivePriceData {
  currentPrice: number;
  dayChange: number;
  name: string;
}

export function useLivePrices(holdings: Holding[], watchlist: WatchlistItem[]) {
  const [livePrices, setLivePrices] = useState<Record<string, LivePriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  const refreshPrices = useCallback(async () => {
    setLoadingPrices(true);
    const prices: Record<string, LivePriceData> = {};
    
    // Unique stocks
    const stockSymbols = new Set<string>();
    holdings.forEach(h => { if (h.type === 'stock' && h.symbol) stockSymbols.add(h.symbol); });
    watchlist.forEach(w => { if (w.type === 'stock' && w.symbol) stockSymbols.add(w.symbol); });

    // Unique MFs
    const mfSchemes = new Set<string>();
    holdings.forEach(h => { if (h.type === 'mf' && h.schemeCode) mfSchemes.add(h.schemeCode); });
    watchlist.forEach(w => { if (w.type === 'mf' && w.schemeCode) mfSchemes.add(w.schemeCode); });

    try {
      const stockPromises = Array.from(stockSymbols).map(async sym => {
        try {
          const info = await fetchStockPrice(sym);
          if (info && info.currentPrice > 0) {
            prices[`stock_${sym.toUpperCase()}`] = {
              currentPrice: info.currentPrice,
              dayChange: info.dayChangePercent,
              name: info.longName
            };
          }
        } catch (e) {
          console.warn(`Failed to fetch stock price for ${sym}:`, e);
        }
      });

      const mfPromises = Array.from(mfSchemes).map(async code => {
        try {
          const info = await fetchMutualFundNav(code);
          if (info && info.currentNav > 0) {
            prices[`mf_${code}`] = {
              currentPrice: info.currentNav,
              dayChange: 0, // MFAPI usually doesn't provide day change easily in the same call
              name: info.fundName
            };
          }
        } catch (e) {
          console.warn(`Failed to fetch mutual fund NAV for ${code}:`, e);
        }
      });

      await Promise.allSettled([...stockPromises, ...mfPromises]);
      setLivePrices(prev => ({ ...prev, ...prices }));
    } catch (err) {
      console.error("Error updating portfolio prices:", err);
    } finally {
      setLoadingPrices(false);
    }
  }, [holdings, watchlist]);

  // Fetch prices initially and when holdings/watchlist dependencies change
  useEffect(() => {
    refreshPrices();
    
    // Optional: Auto-refresh every 10 minutes (600,000 ms) to keep it fresh
    const interval = setInterval(() => {
      refreshPrices();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refreshPrices]);

  return { livePrices, refreshPrices, loadingPrices };
}
