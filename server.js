// server.ts
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();
function cleanPrivateKey(keyInput) {
  let key = keyInput.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1).trim();
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.substring(1, key.length - 1).trim();
  }
  key = key.replace(/\\n/g, "\n");
  key = key.replace(/\\r/g, "\r");
  key = key.trim();
  if (key.startsWith("{") && key.endsWith("}")) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) {
        key = parsed.private_key.trim();
      }
    } catch (e) {
    }
  }
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.substring(1, key.length - 1).trim();
  }
  key = key.replace(/\\n/g, "\n").replace(/\\r/g, "\r").trim();
  const beginMatch = key.match(/-----BEGIN[A-Z0-9\s]+PRIVATE KEY-----/);
  const endMatch = key.match(/-----END[A-Z0-9\s]+PRIVATE KEY-----/);
  if (beginMatch && endMatch) {
    const beginHeader = beginMatch[0];
    const endHeader = endMatch[0];
    const startIndex = key.indexOf(beginHeader) + beginHeader.length;
    const endIndex = key.indexOf(endHeader);
    const base64Part = key.substring(startIndex, endIndex);
    const rawBase64 = base64Part.split(/[\r\n]+/).map((line) => line.trim()).filter((line) => line.length > 0).join("");
    const formattedLines = [];
    for (let i = 0; i < rawBase64.length; i += 64) {
      formattedLines.push(rawBase64.substring(i, i + 64));
    }
    return `${beginHeader}
${formattedLines.join("\n")}
${endHeader}
`;
  }
  const rawBase = key.split(/[\r\n\s]+/).map((line) => line.trim()).filter((line) => line.length > 0).join("");
  const formattedBase64 = [];
  for (let i = 0; i < rawBase.length; i += 64) {
    formattedBase64.push(rawBase.substring(i, i + 64));
  }
  return `-----BEGIN PRIVATE KEY-----
${formattedBase64.join("\n")}
-----END PRIVATE KEY-----
`;
}
async function startServer() {
  const app = express();
  const PORT = 3e3;
  app.use(express.json());
  const DEFAULT_SA_EMAIL = "investment@gen-lang-client-0137730538.iam.gserviceaccount.com";
  const DEFAULT_SA_PK = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJepRZg5aEDDYm\nXRFHcrOHBPxFU/LGj+NmY39G7VSUaKC99tXpTN2SRQUEPWaVD76gJlI8bHZCqSnr\nLhfZlE7SWZrzJTAt+q5r/rskKQfYKbzmjS0/GCUmdaZAgr3K/LzwTKlUKMa0wIrQ\nGuz9un9oXBVL404ZaMzwzcMfRJ+douHCNo1qTdG+bzuyaUwCIsaFW6U15iC8VOi0\nSocNQ7qvZ5tJppRUzU8hPszF/s4kow6JjicoOddKGuwcATSEBivdejA+4us0rAC6\ngCBz8dS9QFwF8HWJPLpcHAplQAN16YFsxnbcN5PZYPEw71VbNz6M3acP5sYzmjTQ\nlIB+vWObAgMBAAECggEADmlkvtRr9KJqUICGvGLG1wkdwcMZUhJidI/4ajU5asDj\nLUNrQLFoBfmcPBXnm7umaePj16ugd/CMGDpR/Wp04D9a7I/ZQZNgB5yPJq0tVk0s\nqccpGI1xwYMCiInG6VlTwH09/Xr0imMIFY5fgQoRPqtGNglFLF8ejbkCKd8+6vJm\nPnQ7b6Cqt6OePeEpBd6DvYSW4mffKKsNeOyp+SikHmHRbU72OKBMdlj/ui42xRqe\n0gz5TxaZlbHNTZNxqiLkcUosj1zAuVfnUt1EnJe7SSay/5GSp5bRC+KQ6xelHo+W\nH59DILkiIZoHKDqUfKgLo9Ny5CiIp+fgJg4ZVly9QKBgQD6SJ7711sLows/E7/M\neJUserAqVh0kal5R3bRioNdsy0Kr5khqBojWtjGqW6g4bISO2TqNlpRtUA41NHj2\ncE0a1th6UfYvjWqUIeaZwJtvPtsDub9IgZ077YCre/RJ/ZgDOcnTSJNaqRZ5/YGg\nIxH1JBivOtzIVHC93RxPPz45DQKBgQDOFJov0lgjMLcnhlRwsOgCwztV8LM2DJ2r\nEoD6Q/8pRjeakEydpSsQJH0pYJyiHcx/al1o8eZ4wDAjT5O3LZ91n/D8BhnO89jy\ne9xsjy98GW7UZrN65N2dI4yXZ72S2ZEF6IgulciXQgYmnRZV5++527IeF+A0W6FO\nrH4LkqOVRwKBgEh58x/2kvThuAYCEA6D9J62wIDiAvpimwGV9ACDlx54Fcx1mQ6q\n6cFTbTpp5GLCefhry1ro+f5VqmeZ1FV427sj7/gr9+B5UR2oW4C2l8w1JXMEvPGg\nJwoNkq8V6/3pI7X7bAh1AcbFJC8bTAg1X6PfWg6UOw7/9M3mU6ZXKAuZAoGADIV3\n8Nvo+wpktoQU8VvuXOyb2FbtrKULl29iYtJq2Ikpq7yEyzdT7IErEa6LFdaVrFA8\nKLo59LBIvHyDTyf4fl8fd1CvlMGANwuLkxUIH5Q0BbfPw/HP/VJBopltDVUm2KMO\nUzZKn9YlJYd56fJTwIk2w1lUCBphLLSSXAWm5tUCgYEApOxpCADglz/dEH8XnBtX\nSe6/totOPnWx0Fah7m6L4dm2GtBGGiD7G4XoiGT7uoFyQxUGZDhXYkofoDgu3wuw\nDxBNQ7/mxche6MVXbrJOkOtUG9ME9rJjUPG0yDbJeJqWC/IzWxWphDYnT1MaE77v\nyvlaT7zW9Xd5RqUUd3EyN05=\n-----END PRIVATE KEY-----\n";
  app.post("/api/get-google-service-token", async (req, res) => {
    try {
      let clientEmail = req.body?.clientEmail || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || DEFAULT_SA_EMAIL;
      let privateKeyInput = req.body?.privateKey || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || DEFAULT_SA_PK;
      if (!privateKeyInput || !clientEmail) {
        return res.status(400).json({
          error: "Google Service Account credentials not provided."
        });
      }
      let privateKey = privateKeyInput.trim();
      if (privateKey.startsWith("{") && privateKey.endsWith("}")) {
        try {
          const parsedJson = JSON.parse(privateKey);
          if (parsedJson.private_key) {
            privateKey = parsedJson.private_key;
          }
          if (parsedJson.client_email) {
            clientEmail = parsedJson.client_email;
          }
        } catch (je) {
          console.warn("[GoogleToken] Unreadable JSON credential block:", je);
        }
      }
      let emailStr = clientEmail.trim();
      if (emailStr.startsWith("{") && emailStr.endsWith("}")) {
        try {
          const parsedEmailJson = JSON.parse(emailStr);
          if (parsedEmailJson.client_email) {
            emailStr = parsedEmailJson.client_email;
          }
          if (parsedEmailJson.private_key) {
            privateKey = parsedEmailJson.private_key;
          }
        } catch (je) {
        }
      }
      privateKey = cleanPrivateKey(privateKey);
      const requestedScopes = req.body?.scopes || [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/contacts",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/tasks",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/chat.spaces.readonly",
        "https://www.googleapis.com/auth/chat.messages.create",
        "https://www.googleapis.com/auth/classroom.courses.readonly"
      ];
      const client = new JWT({
        email: emailStr,
        key: privateKey,
        scopes: requestedScopes
      });
      console.log(`[GoogleToken] Exchanging credentials for email: ${emailStr} with scopes:`, requestedScopes);
      const tokens = await client.authorize();
      res.json({
        accessToken: tokens.access_token,
        expiry: tokens.expiry_date,
        clientEmail: emailStr
      });
    } catch (err) {
      console.error("[GoogleToken] Fetch token exception:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  const stockCache = /* @__PURE__ */ new Map();
  const mfCache = /* @__PURE__ */ new Map();
  const searchCache = /* @__PURE__ */ new Map();
  app.get("/api/stock-price", async (req, res) => {
    try {
      const symbol = req.query.symbol;
      if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({ error: "Stock symbol query parameter is required" });
      }
      let cleanSymbol = symbol.trim().toUpperCase();
      if (!cleanSymbol.endsWith(".NS") && !cleanSymbol.endsWith(".BO") && !cleanSymbol.includes(".")) {
        cleanSymbol += ".NS";
      }
      const cached = stockCache.get(cleanSymbol);
      if (cached && Date.now() - cached.timestamp < 60 * 1e3) {
        return res.json(cached.data);
      }
      console.log(`[StockProxy] Fetching price for symbol: ${cleanSymbol}`);
      let apiResponse;
      let usedQuery = "query2";
      try {
        apiResponse = await fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!apiResponse.ok) {
          throw new Error(`query2 failed with status ${apiResponse.status}`);
        }
      } catch (e) {
        console.warn(`[StockProxy] query2 failed for ${cleanSymbol}, trying query1:`, e);
        usedQuery = "query1";
        apiResponse = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(cleanSymbol)}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
      }
      if (!apiResponse.ok) {
        return res.status(apiResponse.status).json({
          error: `Yahoo Finance API returned error state ${apiResponse.status}`,
          symbol: cleanSymbol
        });
      }
      const data = await apiResponse.json();
      const result = data?.chart?.result?.[0];
      const meta = result?.meta;
      let currentPrice = meta?.regularMarketPrice || meta?.previousClose;
      if (!currentPrice) {
        const closes = result?.indicators?.quote?.[0]?.close;
        if (Array.isArray(closes) && closes.length > 0) {
          currentPrice = closes.filter((val) => val !== null).pop();
        }
      }
      let previousClose = meta?.chartPreviousClose || meta?.previousClose || currentPrice;
      if (!previousClose) {
        const opens = result?.indicators?.quote?.[0]?.open;
        if (Array.isArray(opens) && opens.length > 0) {
          previousClose = opens.filter((val) => val !== null)[0];
        }
      }
      if (currentPrice) {
        const diff = currentPrice - previousClose;
        const dayChangePercent = previousClose ? diff / previousClose * 100 : 0;
        const resultPayload = {
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          dayChangePercent: parseFloat(dayChangePercent.toFixed(2)),
          longName: (meta?.longName || cleanSymbol.split(".")[0]).toUpperCase(),
          usedQuery,
          symbol: cleanSymbol
        };
        stockCache.set(cleanSymbol, {
          data: resultPayload,
          timestamp: Date.now()
        });
        return res.json(resultPayload);
      } else {
        return res.status(404).json({
          error: "Could not locate live quote data inside response structure",
          symbol: cleanSymbol
        });
      }
    } catch (err) {
      console.error("[StockProxy] Fetch exception:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app.get("/api/mf-nav", async (req, res) => {
    try {
      const code = req.query.code;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Mutual Fund code parameter is required" });
      }
      const cleanCode = code.trim();
      const cached = mfCache.get(cleanCode);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1e3) {
        return res.json(cached.data);
      }
      console.log(`[MFProxy] Fetching NAV for AMFI code: ${cleanCode}`);
      const apiResponse = await fetch(`https://api.mfapi.in/mf/${cleanCode}`);
      if (!apiResponse.ok) {
        return res.status(apiResponse.status).json({
          error: `MFAPI returned error state ${apiResponse.status}`,
          code: cleanCode
        });
      }
      const data = await apiResponse.json();
      const currentNav = parseFloat(data?.data?.[0]?.nav || "0");
      const fundName = data?.meta?.scheme_name || "Mutual Fund Scheme";
      if (currentNav > 0) {
        const resultPayload = {
          currentNav,
          fundName
        };
        mfCache.set(cleanCode, {
          data: resultPayload,
          timestamp: Date.now()
        });
        return res.json(resultPayload);
      } else {
        return res.status(404).json({
          error: "Invalid NAV data returned from AMFI API",
          code: cleanCode
        });
      }
    } catch (err) {
      console.error("[MFProxy] Fetch exception:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app.get("/api/stock-search", async (req, res) => {
    try {
      const queryStr = req.query.q;
      if (!queryStr || typeof queryStr !== "string" || queryStr.trim().length < 2) {
        return res.status(400).json({ error: "Valid search query of at least 2 characters is required" });
      }
      const cleanQuery = queryStr.trim().toLowerCase();
      const cached = searchCache.get(cleanQuery);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1e3) {
        return res.json(cached.data);
      }
      console.log(`[SearchProxy] Searching Yahoo Finance for: "${cleanQuery}"`);
      const searchUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleanQuery)}&newsCount=0`;
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to search Yahoo Finance API" });
      }
      const data = await response.json();
      const quotes = data?.quotes || [];
      const suggestions = quotes.filter((q) => {
        return q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF") && (q.symbol.endsWith(".NS") || q.symbol.endsWith(".BO") || q.exchange === "NSI" || q.exchange === "BSE");
      }).map((q) => {
        const rawSymbol = q.symbol;
        const displaySymbol = rawSymbol.split(".")[0];
        return {
          symbol: displaySymbol,
          rawSymbol,
          name: q.longname || q.shortname || displaySymbol,
          exch: q.exchange || (rawSymbol.endsWith(".NS") ? "NSE" : "BSE")
        };
      }).slice(0, 8);
      const finalSuggestions = suggestions.length > 0 ? suggestions : quotes.slice(0, 5).map((q) => ({
        symbol: q.symbol.split(".")[0],
        rawSymbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exch: q.exchange || "MKT"
      }));
      searchCache.set(cleanQuery, {
        data: finalSuggestions,
        timestamp: Date.now()
      });
      return res.json(finalSuggestions);
    } catch (err) {
      console.error("[SearchProxy] Search exception:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Financial Rolodex fully active" });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server boot successful on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.js.map
