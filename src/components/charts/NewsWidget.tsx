import React, { memo } from 'react';

const NewsWidget = ({ theme = 'light' }: { theme?: 'light' | 'dark' }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-white">
      <iframe
        src={`https://s.tradingview.com/embed-widget/timeline/?locale=in#${encodeURIComponent(JSON.stringify({
          feedMode: "all_symbols",
          colorTheme: theme,
          isTransparent: true,
          displayMode: "regular",
          width: "100%",
          height: "100%",
          utm_source: window.location.hostname,
          utm_medium: "widget",
          utm_campaign: "timeline"
        }))}`}
        style={{ width: "100%", height: "100%", border: "none" }}
        title="Market News"
      />
    </div>
  );
};

export default memo(NewsWidget);
