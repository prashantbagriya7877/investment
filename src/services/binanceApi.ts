import CryptoJS from 'crypto-js';

const SPOT_API_URL = 'https://api.binance.com';
const FUTURES_API_URL = 'https://fapi.binance.com';

// -------------------------------------------------------------
// HELPER: SIGN REQUESTS
// -------------------------------------------------------------
const signRequest = (queryString: string, apiSecret: string) => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
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

  const baseUrl = isFutures ? FUTURES_API_URL : SPOT_API_URL;
  const timestamp = Date.now();
  
  const queryParams = new URLSearchParams({
    ...params,
    timestamp: timestamp.toString(),
    recvWindow: '5000', // standard Binance recv window
  });

  const queryString = queryParams.toString();
  const signature = signRequest(queryString, apiSecret);
  
  const finalUrl = `${baseUrl}${endpoint}?${queryString}&signature=${signature}`;

  const response = await fetch(finalUrl, {
    method,
    headers: {
      'X-MBX-APIKEY': apiKey,
    },
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
    const response = await fetch(`${SPOT_API_URL}/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`);
    if (!response.ok) throw new Error('Failed to fetch ticker data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance ticker:', error);
    return null;
  }
};

export const getBinanceOpenInterest = async (symbol: string) => {
  try {
    const response = await fetch(`${FUTURES_API_URL}/fapi/v1/openInterest?symbol=${symbol.toUpperCase()}`);
    if (!response.ok) throw new Error('Failed to fetch open interest');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Binance Open Interest:', error);
    return null;
  }
};

export const getBinanceFundingRate = async (symbol: string) => {
  try {
    const response = await fetch(`${FUTURES_API_URL}/fapi/v1/premiumIndex?symbol=${symbol.toUpperCase()}`);
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
