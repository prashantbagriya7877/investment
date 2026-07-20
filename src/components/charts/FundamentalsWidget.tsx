import React, { memo, useEffect, useRef } from 'react';

interface FundamentalsWidgetProps {
  instrumentKey: string;
}

const FundamentalsWidget = ({ instrumentKey }: FundamentalsWidgetProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const getTVSymbol = (sym: string) => {
    let finalSym = sym.trim();
    if (!finalSym) return 'BSE:SENSEX';
    if (finalSym === 'NSE:NIFTY' || finalSym.includes('Nifty') || finalSym.includes('NIFTY 50')) return 'BSE:SENSEX';
    
    if (finalSym.includes(':')) {
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
       return 'BSE:SENSEX';
    }

    return `NSE:${finalSym.toUpperCase().replace(/\s+/g, '')}`;
  };

  const tvSymbol = getTVSymbol(instrumentKey);
  const isUnsupported = tvSymbol === 'NSE:NIFTY' || tvSymbol === 'BSE:SENSEX' || tvSymbol.includes('OANDA:') || tvSymbol.includes('BINANCE:') || tvSymbol.includes('FOREXCOM:');

  useEffect(() => {
    if (!containerRef.current || isUnsupported) return;

    // Clean up previous widget
    containerRef.current.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%; width:100%"></div>';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-financials.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = `
      {
        "colorTheme": "light",
        "isTransparent": true,
        "largeChartUrl": "",
        "displayMode": "regular",
        "width": "100%",
        "height": "100%",
        "symbol": "${tvSymbol}",
        "locale": "in"
      }
    `;

    containerRef.current.appendChild(script);
  }, [tvSymbol, isUnsupported]);

  if (isUnsupported) {
    return (
      <div className="w-full h-full bg-white p-6 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22h20"/><path d="M17 2v20"/><path d="M22 17H2"/><path d="M7 2v20"/><path d="M22 7H2"/></svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Fundamentals Not Available</h3>
        <p className="text-slate-500 text-sm max-w-sm">
          Fundamental data (Balance Sheet, Income Statement, etc.) is only available for individual company stocks, not for market indices or forex/crypto.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="tradingview-widget-container flex-1" ref={containerRef} style={{ height: "100%", width: "100%" }}>
        <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
      </div>
    </div>
  );
};

export default memo(FundamentalsWidget);
