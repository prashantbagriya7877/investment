import React, { useEffect, useRef, memo } from 'react';

const FundamentalsWidget = ({ symbol, theme = 'light' }: { symbol: string; theme?: 'light' | 'dark' }) => {
  const container = useRef<HTMLDivElement>(null);

  const getTVSymbol = (sym: string): string => {
    let finalSym = sym.trim();
    if (!finalSym) return 'NSE:RELIANCE';

    if (finalSym.includes(':')) {
      // Prefer NSE over BSE for financial data availability
      if (finalSym.startsWith('BSE:')) return 'NSE:' + finalSym.split(':')[1];
      return finalSym;
    }

    if (finalSym.includes('|')) {
      if (finalSym.includes('002A01018')) return 'NSE:RELIANCE';
      if (finalSym.includes('467B01029')) return 'NSE:TCS';
      if (finalSym.includes('009A01021')) return 'NSE:INFY';
      if (finalSym.includes('040A01034')) return 'NSE:HDFCBANK';
      if (finalSym.includes('090A01021')) return 'NSE:ICICIBANK';
      if (finalSym.includes('075A01022')) return 'NSE:WIPRO';
      if (finalSym.includes('062A01020')) return 'NSE:SBIN';
      if (finalSym.includes('112A01023')) return 'NSE:BAJFINANCE';
      return 'NSE:RELIANCE';
    }

    // Indices / commodities / forex — fallback to a popular stock
    const upper = finalSym.toUpperCase();
    if (
      upper.includes('NIFTY') || upper.includes('SENSEX') ||
      upper.includes('XAUUSD') || upper.includes('XAGUSD') ||
      upper.includes('EURUSD') || upper.includes('GBPUSD') ||
      upper.includes('USDJPY') || upper.includes('DXY') ||
      upper.includes('BTCUSD') || upper.includes('ETHUSD')
    ) {
      return 'NSE:RELIANCE';
    }

    return `NSE:${finalSym.toUpperCase()}`;
  };

  const tvSymbol = getTVSymbol(symbol);

  useEffect(() => {
    if (!container.current) return;

    // Clear previous widget
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: theme,
      isTransparent: false,
      largeChartUrl: '',
      displayMode: 'regular',
      width: '100%',
      height: '100%',
      symbol: tvSymbol,
      locale: 'in',
    });

    container.current.appendChild(script);
  }, [tvSymbol, theme]);

  return (
    <div
      className="tradingview-widget-container w-full h-full"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    />
  );
};

export default memo(FundamentalsWidget);
