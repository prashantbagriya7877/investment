import express from "express";

export function setupUpstoxRoutes(app: express.Application) {
  // --- UPSTOX BROKER API PROXIES (PHASE 1) ---

  // 1. Token Exchange (OAuth)
  app.post("/api/upstox/token", async (req, res) => {
    try {
      const { code, client_id, client_secret, redirect_uri } = req.body;
      if (!code || !client_id || !client_secret || !redirect_uri) {
        return res.status(400).json({ error: "Missing required fields for Upstox OAuth" });
      }

      const params = new URLSearchParams();
      params.append('code', code);
      params.append('client_id', client_id);
      params.append('client_secret', client_secret);
      params.append('redirect_uri', redirect_uri);
      params.append('grant_type', 'authorization_code');

      const response = await fetch('https://api.upstox.com/v2/login/authorization/token', {
        method: 'POST',
        headers: {
          'Api-Version': '2.0',
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to exchange token');
      }
      res.json(data);
    } catch (err: any) {
      console.error("[Upstox API] Token Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Fetch User Profile
  app.get("/api/upstox/profile", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const response = await fetch('https://api.upstox.com/v2/user/profile', {
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Fetch User Funds & Margin
  app.get("/api/upstox/funds", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const response = await fetch('https://api.upstox.com/v2/user/get-funds-and-margin', {
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Fetch Portfolio Holdings
  app.get("/api/upstox/holdings", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const response = await fetch('https://api.upstox.com/v2/portfolio/long-term-holdings', {
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- UPSTOX BROKER API PROXIES (PHASE 2) ---

  // 5. Market Quotes (LTP, OHLC)
  app.get("/api/upstox/market-quote", async (req, res) => {
    try {
      const token = req.headers.authorization;
      const symbol = req.query.symbol as string;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });
      if (!symbol) return res.status(400).json({ error: "Missing symbol" });

      const response = await fetch(`https://api.upstox.com/v2/market-quote/quotes?instrument_key=${encodeURIComponent(symbol)}`, {
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Option Chain
  app.get("/api/upstox/option-chain", async (req, res) => {
    try {
      const token = req.headers.authorization;
      const instrument_key = req.query.instrument_key as string;
      const expiry_date = req.query.expiry_date as string;
      
      if (!token) return res.status(401).json({ error: "Missing authorization token" });
      if (!instrument_key || !expiry_date) return res.status(400).json({ error: "Missing instrument_key or expiry_date" });

      const response = await fetch(`https://api.upstox.com/v2/option/chain?instrument_key=${encodeURIComponent(instrument_key)}&expiry_date=${encodeURIComponent(expiry_date)}`, {
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Place Order
  app.post("/api/upstox/order", async (req, res) => {
    try {
      const token = req.headers.authorization;
      if (!token) return res.status(401).json({ error: "Missing authorization token" });

      const response = await fetch('https://api.upstox.com/v2/order/place', {
        method: 'POST',
        headers: {
          'Api-Version': '2.0',
          'Authorization': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
