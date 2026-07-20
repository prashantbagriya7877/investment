import express from "express";

export function setupBinanceRoutes(app: express.Application) {
  app.all("/api/binance/*", async (req, res) => {
    try {
      const endpoint = req.originalUrl.replace('/api/binance', '');
      const apiKey = req.headers['x-mbx-apikey'] as string;
      const isFutures = req.headers['x-binance-futures'] === 'true';

      const baseUrl = isFutures ? 'https://fapi.binance.com' : 'https://api.binance.com';
      const targetUrl = `${baseUrl}${endpoint}`;

      const headers: Record<string, string> = {};
      if (apiKey) headers['X-MBX-APIKEY'] = apiKey;
      if (req.headers['content-type']) headers['Content-Type'] = req.headers['content-type'] as string;

      const response = await fetch(targetUrl, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
      });

      // Pass through the exact status and JSON response from Binance
      const data = await response.text(); // Parse as text first in case it's not JSON
      try {
        const jsonData = JSON.parse(data);
        res.status(response.status).json(jsonData);
      } catch (e) {
        res.status(response.status).send(data);
      }

    } catch (err: any) {
      console.error("[Binance Proxy] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
}
