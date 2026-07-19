import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, BarChart2, Activity, PieChart, TrendingUp, Search, RefreshCw, Zap, Globe, AlertTriangle, ExternalLink, CheckCircle, ArrowLeft, List, Clock, LayoutGrid, Home, CalendarDays, Building2, Newspaper } from 'lucide-react';
import AdvancedChartWidget from './charts/AdvancedChartWidget';
import OptionChainChart from './charts/OptionChainChart';
import PortfolioDonutChart from './charts/PortfolioDonutChart';
import MarketHeatmap from './charts/MarketHeatmap';
import PLChart from './charts/PLChart';
import UpstoxOrderTicket from './UpstoxOrderTicket';
import FundamentalsWidget from './charts/FundamentalsWidget';
import EconomicCalendarWidget from './charts/EconomicCalendarWidget';
import NewsWidget from './charts/NewsWidget';
import { upstoxApi } from '../services/upstoxApi';

type TabId = 'dashboard' | 'candlestick' | 'options' | 'portfolio' | 'heatmap' | 'pnl' | 'order' | 'fundamentals' | 'calendar' | 'news';

const TABS = [
  { id: 'candlestick' as TabId, label: 'Historical Chart', icon: LineChart, color: 'text-blue-500', desc: 'View detailed candlestick patterns and technical analysis.' },
  { id: 'fundamentals' as TabId, label: 'Fundamental Details', icon: Building2, color: 'text-cyan-500', desc: 'View company profile, financials, and key metrics.' },
  { id: 'calendar' as TabId, label: 'Economic Calendar', icon: CalendarDays, color: 'text-rose-500', desc: 'Track global economic events and indicators.' },
  { id: 'news' as TabId, label: 'Market News', icon: Newspaper, color: 'text-purple-500', desc: 'Get the latest top stories and market news globally.' },
  { id: 'options' as TabId, label: 'Option Chain', icon: BarChart2, color: 'text-indigo-500', desc: 'Analyze strike prices, open interest, and LTP for options.' },
  { id: 'order' as TabId, label: 'Order Execution', icon: Zap, color: 'text-purple-500', desc: 'Place buy and sell orders directly to your Upstox account.' },
  { id: 'portfolio' as TabId, label: 'Portfolio Analytics', icon: PieChart, color: 'text-emerald-500', desc: 'Visualize your holdings distribution and exposure.' },
  { id: 'heatmap' as TabId, label: 'Market Heatmap', icon: Globe, color: 'text-orange-500', desc: 'Spot top gainers and losers in the market at a glance.' },
  { id: 'pnl' as TabId, label: 'P&L Tracker', icon: TrendingUp, color: 'text-yellow-500', desc: 'Track your realized and unrealized profit & loss over time.' },
];

const POPULAR_STOCKS = [
  { label: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
  { label: 'Reliance', key: 'NSE_EQ|INE002A01018' },
  { label: 'TCS', key: 'NSE_EQ|INE467B01029' },
  { label: 'Infosys', key: 'NSE_EQ|INE009A01021' },
  { label: 'HDFC Bank', key: 'NSE_EQ|INE040A01034' },
  { label: 'ICICI Bank', key: 'NSE_EQ|INE090A01021' },
  { label: 'Wipro', key: 'NSE_EQ|INE075A01022' },
  { label: 'SBI', key: 'NSE_EQ|INE062A01020' },
];

const INTERVALS = ['1minute', '5minute', '15minute', '30minute', '1hour', 'day', 'week', 'month'];

// ─── Mock Data Generators ──────────────────────────────────────────
function generateMockCandlesticks() {
  const data: any[] = [];
  let base = 2900;
  let time = new Date('2024-03-01T09:15:00').getTime();
  for (let i = 0; i < 120; i++) {
    const open = base + (Math.random() - 0.5) * 15;
    const close = open + (Math.random() - 0.5) * 25;
    const high = Math.max(open, close) + Math.random() * 8;
    const low = Math.min(open, close) - Math.random() * 8;
    data.push([new Date(time).toISOString(), +open.toFixed(2), +high.toFixed(2), +low.toFixed(2), +close.toFixed(2), Math.floor(Math.random() * 200000), 0]);
    time += 60000;
    base = close;
  }
  return data;
}

function generateMockOptionChain() {
  const data: any[] = [];
  let strike = 2800;
  for (let i = 0; i < 20; i++) {
    data.push({
      strike_price: strike,
      call_options: { market_data: { oi: Math.floor(Math.random() * 200000 + 10000), ltp: (Math.random() * 150 + 5).toFixed(2) } },
      put_options: { market_data: { oi: Math.floor(Math.random() * 200000 + 10000), ltp: (Math.random() * 150 + 5).toFixed(2) } }
    });
    strike += 20;
  }
  return data;
}

function generateMockHeatmapData() {
  return [
    { name: 'Reliance', change: 2.4, value: 80 }, { name: 'TCS', change: -0.8, value: 70 },
    { name: 'HDFC Bank', change: 1.2, value: 65 }, { name: 'Infosys', change: -2.1, value: 60 },
    { name: 'ICICI Bank', change: 3.1, value: 55 }, { name: 'SBI', change: -0.3, value: 50 },
    { name: 'Wipro', change: 0.9, value: 40 }, { name: 'Bajaj Finance', change: -3.5, value: 45 },
    { name: 'Maruti', change: 1.8, value: 35 }, { name: 'ONGC', change: -1.2, value: 30 },
    { name: 'Sun Pharma', change: 2.7, value: 38 }, { name: 'Adani Ports', change: -0.5, value: 28 },
    { name: 'HUL', change: 0.4, value: 42 }, { name: 'Nestle', change: -1.9, value: 25 },
    { name: 'Titan', change: 4.2, value: 32 }, { name: 'LTI', change: -2.8, value: 22 },
    { name: 'M&M', change: 1.5, value: 36 }, { name: 'UltraTech', change: -0.7, value: 29 },
  ];
}

function generateMockPLData() {
  const months = ['Oct 23', 'Nov 23', 'Dec 23', 'Jan 24', 'Feb 24', 'Mar 24', 'Apr 24', 'May 24', 'Jun 24'];
  return months.map(m => ({
    date: m,
    realized: (Math.random() - 0.35) * 20000,
    unrealized: (Math.random() - 0.4) * 10000
  }));
}

function generateMockPortfolio() {
  return [
    { name: 'Reliance Industries', currentValue: 85000, type: 'Large Cap' },
    { name: 'HDFC Bank', currentValue: 72000, type: 'Large Cap' },
    { name: 'TCS', currentValue: 65000, type: 'Large Cap' },
    { name: 'SBI Small Cap Fund', currentValue: 48000, type: 'Mutual Fund' },
    { name: 'Nifty 50 ETF', currentValue: 55000, type: 'ETF' },
    { name: 'Infosys', currentValue: 38000, type: 'Large Cap' },
    { name: 'Axis Small Cap', currentValue: 29000, type: 'Mutual Fund' },
    { name: 'ICICI Bank', currentValue: 41000, type: 'Large Cap' },
  ];
}

interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'greater_than' | 'less_than';
  targetPrice: number;
  active: boolean;
}

export default function ResearchTerminal({ livePrices = {} }: { livePrices?: any }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [optionChainData, setOptionChainData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [plData, setPlData] = useState<any[]>([]);
  const [marketQuote, setMarketQuote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [instrumentKey, setInstrumentKey] = useState('NSE_EQ|INE002A01018');
  const [inputKey, setInputKey] = useState('NSE_EQ|INE002A01018');
  const [interval, setIntervalVal] = useState('day');
  const [expiryDate, setExpiryDate] = useState('2024-12-26');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New States for Multi-Chart & Watchlist
  const [chartLayout, setChartLayout] = useState<'1' | 'split-v' | 'split-h' | 'grid-4' | 'grid-8'>('1');
  const [chartSymbols, setChartSymbols] = useState<string[]>(['OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD', 'OANDA:XAUUSD']);
  const [activeChartIndex, setActiveChartIndex] = useState<number>(0);
  const [activeSidebar, setActiveSidebar] = useState<'watchlist' | 'alerts' | 'layout' | null>('watchlist');
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 64px * 4 = 256px
  const isDraggingSidebar = useRef(false);

  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('tv_price_alerts') || '[]');
    } catch { return []; }
  });
  
  const [tvWatchlistSymbols, setTvWatchlistSymbols] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tv_native_watchlist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['OANDA:XAUUSD'];
  });

  // Save watchlist to local storage
  useEffect(() => {
    localStorage.setItem('tv_native_watchlist', JSON.stringify(tvWatchlistSymbols));
  }, [tvWatchlistSymbols]);

  // Sidebar Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar.current) return;
      // e.clientX is from the left. The sidebar is on the right.
      // So width is window.innerWidth - e.clientX - 45px (for the thin right toolbar)
      const newWidth = window.innerWidth - e.clientX - 45;
      if (newWidth >= 200 && newWidth <= 800) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDraggingSidebar.current = false;
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Polling Alerts against Live Prices
  useEffect(() => {
    if (!livePrices || Object.keys(livePrices).length === 0) return;
    
    let alertsTriggered = false;
    const updatedAlerts = alerts.map(alertItem => {
      if (!alertItem.active) return alertItem;
      
      const currentPriceObj = livePrices[alertItem.symbol];
      if (!currentPriceObj || !currentPriceObj.ltp) return alertItem;
      
      const currentPrice = currentPriceObj.ltp;
      let triggered = false;
      
      if (alertItem.condition === 'greater_than' && currentPrice >= alertItem.targetPrice) triggered = true;
      if (alertItem.condition === 'less_than' && currentPrice <= alertItem.targetPrice) triggered = true;
      
      if (triggered) {
        alertsTriggered = true;
        // Trigger browser notification or custom toast
        alert(`PRICE ALERT: ${alertItem.symbol} has crossed your target of ₹${alertItem.targetPrice}! (Current: ₹${currentPrice})`);
        return { ...alertItem, active: false };
      }
      return alertItem;
    });
    
    if (alertsTriggered) {
      setAlerts(updatedAlerts);
    }
  }, [livePrices, alerts]);

  // Check if real Upstox token is available
  const token = localStorage.getItem('upstox_access_token') || '';
  const isConnected = token.length > 10;

  // ─── Fetch Live Data ────────────────────────────────────────────  // ✨ Fetch Live Data ✨
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsMock(false);
    setErrorMsg(null);
    setMarketQuote(null);

    try {
      if (isConnected) {
        try {
          const resQuote = await upstoxApi.getMarketQuote(instrumentKey, token);
          if (resQuote?.data && resQuote.data[instrumentKey]) {
            setMarketQuote(resQuote.data[instrumentKey]);
          }
        } catch (err) {
          console.error('Market Quote Error', err);
        }
      }

      if (activeTab === 'candlestick') {
        if (!isConnected) {
          setHistoricalData(generateMockCandlesticks());
          setIsMock(true);
        } else {
          try {
            const toDate = new Date().toISOString().split('T')[0];
            const fromDate = new Date(Date.now() - 30 * 24 * 3600000).toISOString().split('T')[0];
            const res = await upstoxApi.getHistoricalData(instrumentKey, token, interval, toDate, fromDate);
            const candles = res?.data?.candles;
            if (candles && candles.length > 0) {
              setHistoricalData(candles);
              setIsMock(false);
            } else {
              setHistoricalData(generateMockCandlesticks());
              setIsMock(true);
            }
          } catch (err: any) {
            setHistoricalData(generateMockCandlesticks());
            setIsMock(true);
            setErrorMsg(`Historical Data Error: ${err.message}`);
          }
        }
      }

      else if (activeTab === 'options') {
        if (!isConnected) {
          setOptionChainData(generateMockOptionChain());
          setIsMock(true);
        } else {
          try {
            const res = await upstoxApi.getOptionChain(instrumentKey, expiryDate, token);
            const chainData = res?.data;
            if (chainData && chainData.length > 0) {
              setOptionChainData(chainData);
              setIsMock(false);
            } else {
              setOptionChainData(generateMockOptionChain());
              setIsMock(true);
            }
          } catch (err: any) {
            setOptionChainData(generateMockOptionChain());
            setIsMock(true);
            setErrorMsg(`Option Chain Error: ${err.message}`);
          }
        }
      }

      else if (activeTab === 'portfolio') {
        if (!isConnected) {
          setPortfolioData(generateMockPortfolio());
          setIsMock(true);
        } else {
          try {
            const res = await upstoxApi.getHoldings(token);
            const holdings = res?.data;
            if (holdings && holdings.length > 0) {
              const mapped = holdings.map((h: any) => ({
                name: h.trading_symbol || h.instrument_token,
                currentValue: h.last_price * h.quantity,
                type: h.exchange === 'NSE' ? 'Large Cap' : h.exchange
              }));
              setPortfolioData(mapped);
              setIsMock(false);
            } else {
              setPortfolioData(generateMockPortfolio());
              setIsMock(true);
            }
          } catch (err: any) {
            setPortfolioData(generateMockPortfolio());
            setIsMock(true);
            console.error('Portfolio Error:', err.message);
          }
        }
      }

      else if (activeTab === 'heatmap') {
        if (!isConnected) {
          setHeatmapData(generateMockHeatmapData());
          setIsMock(true);
        } else {
          try {
            // Use Market Quote for POPULAR_STOCKS as heatmap source since Movers API isn't publicly accessible via proxy
            const keys = POPULAR_STOCKS.map(s => s.key).join(',');
            const res = await upstoxApi.getMarketQuote(keys, token);
            const data = res?.data;
            if (data && Object.keys(data).length > 0) {
              const combined = Object.keys(data).map(key => {
                const quote = data[key];
                return {
                  name: POPULAR_STOCKS.find(s => s.key === key)?.label || key.split('|')[1],
                  change: quote.net_change || 0,
                  value: Math.abs(quote.last_price || 50)
                };
              });
              setHeatmapData(combined);
              setIsMock(false);
            } else {
              setHeatmapData(generateMockHeatmapData());
              setIsMock(true);
            }
          } catch (err: any) {
            setHeatmapData(generateMockHeatmapData());
            setIsMock(true);
            console.error('Market Heatmap Error:', err.message);
          }
        }
      }

      else if (activeTab === 'pnl') {
        if (!isConnected) {
          setPlData(generateMockPLData());
          setIsMock(true);
        } else {
          try {
            const res = await upstoxApi.getTradePnl(token, 'EQ', '2425');
            const trades = res?.data?.trades_count > 0 ? res.data : null;
            if (trades) {
              // Group realized P&L by month
              const monthly: Record<string, number> = {};
              (res.data?.trade_wise_profit_and_loss || []).forEach((t: any) => {
                const month = t.scrip_open_date?.substring(0, 7) || 'Unknown';
                monthly[month] = (monthly[month] || 0) + (t.realized_pnl || 0);
              });
              const plArr = Object.entries(monthly).map(([date, realized]) => ({ date, realized }));
              setPlData(plArr.length > 0 ? plArr : generateMockPLData());
              setIsMock(plArr.length === 0);
            } else {
              setPlData(generateMockPLData());
              setIsMock(true);
            }
          } catch (err: any) {
            setPlData(generateMockPLData());
            setIsMock(true);
            console.error('Trade P&L Error:', err.message);
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, instrumentKey, interval, token, expiryDate, isConnected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLoad = (e: React.FormEvent) => {
    e.preventDefault();
    setInstrumentKey(inputKey.trim());
  };

  const activeTabDef = TABS.find(t => t.id === activeTab) || TABS[0];
  const stockLabel = POPULAR_STOCKS.find(s => s.key === instrumentKey)?.label || instrumentKey.split('|')[1];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ─── BANNERS (Only visible on Dashboard) ───────────────────────────────── */}
      {activeTab === 'dashboard' && !isConnected && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={15} className="shrink-0 text-amber-500" />
            <span className="text-xs font-semibold">
              Upstox se connected nahi hai — Demo data dikh raha hai.
            </span>
          </div>
          <a
            href="/brokers"
            className="shrink-0 flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <ExternalLink size={11} /> Upstox Connect Karo
          </a>
        </div>
      )}

      {activeTab === 'dashboard' && isConnected && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold text-emerald-800">
            Upstox Connected — Live Market Data
          </span>
        </div>
      )}




      {activeTab === 'dashboard' ? (
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
          <button 
            onClick={() => navigate('/')}
            className="absolute top-2 left-4 sm:top-8 sm:left-4 flex items-center gap-2 px-3 py-2 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Home size={16} />
            <span className="text-sm font-bold hidden sm:inline">Main App</span>
          </button>
          <div className="text-center mb-8 mt-12 sm:mt-0">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Research Dashboard</h2>
            <p className="text-slate-500 font-medium">Select a tool below to analyze the market and your portfolio.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1 transition-all flex flex-col items-start text-left group cursor-pointer"
              >
                <div className={`p-3 rounded-2xl bg-slate-50 mb-4 group-hover:bg-slate-100 transition-colors ${tab.color}`}>
                  <tab.icon size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">{tab.label}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{tab.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
        {/* ✨ LIVE MARKET QUOTE STRIP ✨ */}
        {marketQuote && (
          <div className="mx-4 mt-4 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-6 items-center">
            <div>
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">LTP</p>
              <p className="text-xl font-black text-slate-800">₹{marketQuote.last_price}</p>
            </div>
            <div className={marketQuote.net_change > 0 ? 'text-emerald-600' : 'text-rose-600'}>
              <p className="text-[10px] font-bold tracking-wider">CHANGE</p>
              <p className="text-md font-bold">
                {marketQuote.net_change > 0 ? '+' : ''}{marketQuote.net_change} ({marketQuote.net_change > 0 ? '+' : ''}{((marketQuote.net_change / (marketQuote.last_price - marketQuote.net_change)) * 100).toFixed(2)}%)
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">VOLUME</p>
              <p className="text-md font-bold text-slate-700">{marketQuote.volume?.toLocaleString() || 0}</p>
            </div>
            <div className="hidden md:block">
              <p className="text-[10px] font-bold text-slate-400 tracking-wider">OPEN INTEREST</p>
              <p className="text-md font-bold text-slate-700">{marketQuote.oi?.toLocaleString() || 0}</p>
            </div>
          </div>
        )}

        <div className={activeTab === 'candlestick' ? 'fixed inset-0 z-[100] bg-white w-full h-[100dvh]' : 'max-w-8xl mx-auto px-2 sm:px-2 lg:px-2 mt-2 mb-8'}>
          {/* Quick Stock Chips + Interval Selector (Only when inside relevant tool) */}
          {(activeTab === 'options' || activeTab === 'fundamentals') && (
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-hide">
              {POPULAR_STOCKS.map(s => (
                <button
                  key={s.key}
                  onClick={() => { setInputKey(s.key); setInstrumentKey(s.key); }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border shadow-sm ${
                    instrumentKey === s.key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        <div className={`bg-white rounded-3xl border border-slate-200/60 overflow-hidden ring-1 ring-slate-900/5 ${activeTab === 'candlestick' ? 'h-full flex flex-col !border-none !ring-0 !rounded-none !bg-transparent' : ''}`}>
          {activeTab !== 'candlestick' && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 py-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
              </button>
              <div className={`p-2 rounded-xl bg-white border border-slate-100 ${activeTabDef.color}`}>
                <activeTabDef.icon size={16} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm leading-tight flex items-center gap-2">
                  {activeTabDef.label}
                  {(activeTab === 'options' || activeTab === 'fundamentals') && (
                    <span className="text-xs text-slate-500 font-mono font-medium">{stockLabel}</span>
                  )}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              {(activeTab === 'options' || activeTab === 'fundamentals') && (
                <form onSubmit={handleLoad} className="flex flex-1 items-center gap-2">
                  <div className="relative flex-1 lg:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={inputKey}
                      onChange={e => setInputKey(e.target.value)}
                      placeholder="NSE_EQ|INE002A01018"
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-sm"
                    />
                  </div>
                  <button type="submit" className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                    <Zap size={14} />
                  </button>
                  <button type="button" onClick={fetchData} className="p-1.5 bg-white text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  </button>
                </form>
              )}

                <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
                  {isLoading ? (
                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                      <RefreshCw size={10} className="animate-spin" /> Fetching...
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold flex items-center gap-1.5 px-2 py-1 rounded-full ${isMock ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isMock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {isMock ? 'DEMO' : 'LIVE'}
                    </span>
                  )}
                </div>
            </div>
        </div>
          )}

        {/* Tool Content */}
        <div className={`flex-1 flex flex-col w-full ${activeTab === 'candlestick' ? 'h-full bg-slate-100' : 'bg-slate-50/30 p-0 sm:p-2'}`}>
          {activeTab === 'candlestick' && (
            <div className="flex-1 flex w-full h-full relative">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  className="absolute bottom-4 left-2 z-[110] p-2 bg-white/80 hover:bg-white backdrop-blur-md rounded-lg shadow-md border border-slate-200 text-slate-700 transition-all flex items-center justify-center cursor-pointer"
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
                {/* Chart Grid Area */}
                <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden relative">
                   {/* Dynamic Grid */}
                   <div className={`w-full h-full ${
                      chartLayout === '1' ? 'flex' :
                      chartLayout === 'split-v' ? 'flex flex-row' :
                      chartLayout === 'split-h' ? 'flex flex-col' :
                      chartLayout === 'grid-8' ? 'grid grid-cols-4 grid-rows-2' :
                      'grid grid-cols-2 grid-rows-2'
                   }`}>
                      {Array.from({ length: chartLayout === '1' ? 1 : chartLayout === 'grid-4' ? 4 : chartLayout === 'grid-8' ? 8 : 2 }).map((_, i) => (
                         <div key={i} onClick={() => setActiveChartIndex(i)} className={`flex-1 relative border-0 transition-colors ${activeChartIndex === i ? 'z-0' : ''}`}>
                             <AdvancedChartWidget 
                               symbol={chartSymbols[i]} 
                               theme="light" 
                               widgetId={`chart_widget_${i}`} 
                               chartLayout={chartLayout}
                               onLayoutChange={(layout: any) => setChartLayout(layout)}
                               isPrimary={i === 0}
                               watchlistSymbols={tvWatchlistSymbols}
                               onAddWatchlistSymbol={(sym: string) => {
                                 if (!tvWatchlistSymbols.includes(sym)) setTvWatchlistSymbols([sym, ...tvWatchlistSymbols]);
                               }}
                               onRemoveWatchlistSymbol={(sym: string) => {
                                 setTvWatchlistSymbols(tvWatchlistSymbols.filter(s => s !== sym));
                               }}
                               onSymbolChange={(sym: string) => {
                                 const newCharts = [...chartSymbols];
                                 newCharts[i] = sym;
                                 setChartSymbols(newCharts);
                               }}
                             />
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          )}
          {activeTab === 'options' && (
            <OptionChainChart data={optionChainData} theme="light" />
          )}
          {activeTab === 'portfolio' && (
            <PortfolioDonutChart holdings={portfolioData} theme="light" />
          )}
          {activeTab === 'heatmap' && (
            <MarketHeatmap stocks={heatmapData} title="NSE Top Movers" theme="light" />
          )}
          {activeTab === 'pnl' && (
            <PLChart data={plData} theme="light" />
          )}
          {activeTab === 'fundamentals' && (
             <div className="h-[600px] w-full bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
                <FundamentalsWidget symbol={instrumentKey} theme="light" />
             </div>
          )}
          {activeTab === 'calendar' && (
             <div className="h-[700px] w-full bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
                <EconomicCalendarWidget theme="light" />
             </div>
          )}
          {activeTab === 'news' && (
             <div className="h-[700px] w-full bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
                <NewsWidget theme="light" />
             </div>
          )}
        </div>
      </div>

      {/* Heatmap Stats */}
        {activeTab === 'heatmap' && heatmapData.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Gainers', value: heatmapData.filter(s => s.change > 0).length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Losers', value: heatmapData.filter(s => s.change < 0).length, color: 'text-rose-600', bg: 'bg-rose-50' },
              { label: 'Unchanged', value: heatmapData.filter(s => s.change === 0).length, color: 'text-slate-500', bg: 'bg-slate-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-4 text-center border border-slate-100`}>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-bold text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}


      </div>
      </>
    )}
    </div>
  );
}
