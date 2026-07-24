import CryptoJS from 'crypto-js';
import { proxyFetch } from '../utils/proxyFetch';

const SPOT_API_URL = 'https://api.binance.com';
const FUTURES_API_URL = 'https://fapi.binance.com';

// -------------------------------------------------------------
// HELPER: SIGN REQUESTS
// -------------------------------------------------------------
const signRequest = (queryString: string, apiSecret: string) => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
};

let timeOffset = 0;
let hasSyncedTime = false;

const syncBinanceTime = async (isFutures = false) => {
  try {
    const endpoint = isFutures ? '/fapi/v1/time' : '/api/v3/time';
    const response = await proxyFetch(`/api/binance${endpoint}`, {
      headers: isFutures ? { 'X-Binance-Futures': 'true' } as any : undefined
    });
    if (response.ok) {
      const data = await response.json();
      const serverTime = data.serverTime;
      const localTime = Date.now();
      timeOffset = serverTime - localTime;
      hasSyncedTime = true;
    }
  } catch (e) {
    console.warn('Failed to sync Binance time:', e);
  }
};

const makeSignedRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE',
  params: Record<string, any>,
  apiKey: string,
  apiSecret: string,
  isFutures = false
) => {
  if (!apiKey || !apiSecret) {
    throw new Error('Binance API keys are required for this endpoint.');
  }

  if (!hasSyncedTime) {
    await syncBinanceTime(isFutures);
  }

  const baseUrl = isFutures ? FUTURES_API_URL : SPOT_API_URL;
  const timestamp = Date.now() + timeOffset;
  
  const queryParams = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString(),
    recvWindow: '5000', // standard Binance recv window
  });

  const queryString = queryParams.toString();
  const signature = signRequest(queryString, apiSecret);
  
  const proxyUrl = `/api/binance${endpoint}?${queryString}&signature=${signature}`;

  const headers: any = {
    'X-MBX-APIKEY': apiKey,
  };
  if (isFutures) {
    headers['X-Binance-Futures'] = 'true';
  }

  const response = await proxyFetch(proxyUrl, {
    method,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Binance API Error: ${errorData.msg || response.statusText}`);
  }

  return response.json();
};

// -------------------------------------------------------------
// PUBLIC ENDPOINTS (No Keys Required)
// -------------------------------------------------------------

export const getBinanceTicker24hr = async (symbol: string) => {
  try {
    const response = await proxyFetch(`/api/binance/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`);
    if (!response.ok) throw new Error('Failed to fetch ticker data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance ticker:', error);
    return null;
  }
};

export const getBinanceOpenInterest = async (symbol: string) => {
  try {
    const response = await proxyFetch(`/api/binance/fapi/v1/openInterest?symbol=${symbol.toUpperCase()}`, { headers: { 'X-Binance-Futures': 'true' } as any });
    if (!response.ok) throw new Error('Failed to fetch open interest');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance Open Interest:', error);
    return null;
  }
};

export const getBinanceFundingRate = async (symbol: string) => {
  try {
    const response = await proxyFetch(`/api/binance/fapi/v1/premiumIndex?symbol=${symbol.toUpperCase()}`, { headers: { 'X-Binance-Futures': 'true' } as any });
    if (!response.ok) throw new Error('Failed to fetch funding rate');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance Funding Rate:', error);
    return null;
  }
};

// -------------------------------------------------------------
// PRIVATE ENDPOINTS (API Keys Required)
// -------------------------------------------------------------

export const getBinanceAccountBalances = async (apiKey: string, apiSecret: string) => {
  try {
    const data = await makeSignedRequest('/api/v3/account', 'GET', {}, apiKey, apiSecret, false);
    // Filter out zero balances for cleaner UI
    if (data && data.balances) {
      return data.balances.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);
    }
    return [];
  } catch (error) {
    console.error('Error fetching Binance balances:', error);
    throw error;
  }
};

export const getBinanceOpenOrders = async (symbol: string | null, apiKey: string, apiSecret: string) => {
  try {
    const params = symbol ? { symbol: symbol.toUpperCase() } : {};
    return await makeSignedRequest('/api/v3/openOrders', 'GET', params, apiKey, apiSecret, false);
  } catch (error) {
    console.error('Error fetching Binance open orders:', error);
    throw error;
  }
};

export const getBinanceTradeHistory = async (symbol: string, apiKey: string, apiSecret: string) => {
  try {
    const params = { symbol: symbol.toUpperCase(), limit: 50 };
    return await makeSignedRequest('/api/v3/myTrades', 'GET', params, apiKey, apiSecret, false);
  } catch (error) {
    console.error('Error fetching Binance trade history:', error);
    throw error;
  }
};
