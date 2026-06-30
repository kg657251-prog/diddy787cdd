import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import axios from 'axios';

const WATCHPAYS_CONFIG = {
  baseUrl: 'https://api.watchpays.com/v1/create',
  merchantId: process.env.WATCHPAYS_MERCHANT_ID || '100555238',
  apiKey: process.env.WATCHPAYS_API_KEY || '8f0b68cd9c73c0db0131d86da6def792',
};

const JAZPAYS_CONFIG = {
  baseUrl: 'https://api.jazpays.com/v1/create',
  merchantId: process.env.JAZPAYS_MERCHANT_ID || '100222049',
  apiKey: process.env.JAZPAYS_API_KEY || 'b54849355bc9fe4b4ab33923e251c89d',
};

function generateWatchpaysSignature(merchant_id: string, amount: string, merchant_order_no: string, callback_url: string, apiKey: string) {
  const params: any = { merchant_id, amount, merchant_order_no, callback_url };
  const sortedKeys = Object.keys(params).sort();
  let signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  signStr += `&key=${apiKey}`;
  return createHash('md5').update(signStr).digest('hex');
}

function generateJazpaysSignature(merchant_id: string, amount: string, merchant_order_no: string, callback_url: string, apiKey: string) {
  const params: any = { amount, callback_url, merchant_id, merchant_order_no };
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  for (const key of sortedKeys) {
    signStr += `${key}=${params[key]}&`;
  }
  signStr += `key=${apiKey}`;
  return createHash('md5').update(signStr).digest('hex');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerId, packageId, amount, price, name, email, phone, paymentMethod } = req.body;

    if (!playerId || !packageId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine absolute site URL for callback
    const host = req.headers.host || 'cardinguc.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const merchantOrderNo = `ORD${Date.now()}${randomSuffix}`;
    const formattedAmount = parseFloat(price).toFixed(2);

    let baseUrl = '';
    let requestBody: any = {};

    if (paymentMethod === 'gpay') {
      const callbackUrl = `${siteUrl}/api/payment-callback-jazpays`;
      const signature = generateJazpaysSignature(
        JAZPAYS_CONFIG.merchantId,
        formattedAmount,
        merchantOrderNo,
        callbackUrl,
        JAZPAYS_CONFIG.apiKey
      );

      baseUrl = JAZPAYS_CONFIG.baseUrl;
      requestBody = {
        merchant_id: JAZPAYS_CONFIG.merchantId,
        api_key: JAZPAYS_CONFIG.apiKey,
        amount: formattedAmount,
        merchant_order_no: merchantOrderNo,
        callback_url: callbackUrl,
        signature: signature,
      };
    } else {
      const callbackUrl = `${siteUrl}/api/payment-callback`;
      const signature = generateWatchpaysSignature(
        WATCHPAYS_CONFIG.merchantId,
        formattedAmount,
        merchantOrderNo,
        callbackUrl,
        WATCHPAYS_CONFIG.apiKey
      );

      baseUrl = WATCHPAYS_CONFIG.baseUrl;
      requestBody = {
        merchant_id: WATCHPAYS_CONFIG.merchantId,
        api_key: WATCHPAYS_CONFIG.apiKey,
        amount: formattedAmount,
        merchant_order_no: merchantOrderNo,
        callback_url: callbackUrl,
        extra: `${playerId}`,
        signature: signature,
      };
    }

    console.log(`[create-payment] Initiating ${paymentMethod} payment request to ${baseUrl}`);
    console.log(`[create-payment] Order: ${merchantOrderNo}, Amount: ₹${formattedAmount}`);

    const response = await axios.post(baseUrl, requestBody, {
      timeout: 10000, // 10s timeout
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // Don't throw on 4xx/5xx to log the response
    });

    console.log(`[create-payment] Gateway status: ${response.status}`);
    console.log(`[create-payment] Gateway response:`, JSON.stringify(response.data));

    const data = response.data;

    // Both gateways typically return { success: true, payment_url: "..." } or similar
    // Jazpays docs show the API payload but don't specify the exact response payload.
    // Assuming standard format. If it differs, we can adjust.
    if (data && (data.success === true || data.status === 'success') && data.payment_url) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.payment_url,
        orderId: merchantOrderNo,
      });
    } else if (data && data.url) {
       // fallback if it returns url instead of payment_url
       return res.status(200).json({
        success: true,
        paymentUrl: data.url,
        orderId: merchantOrderNo,
      });
    } else {
      const errorMsg = data?.message || data?.error || 'Payment gateway returned an error. Please try again.';
      console.error(`[create-payment] Gateway error details:`, errorMsg);
      return res.status(200).json({
        success: false,
        error: errorMsg,
        orderId: merchantOrderNo
      });
    }
  } catch (error: any) {
    console.error('[create-payment] Internal Exception:', error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(500).json({ error: 'Payment gateway timed out. Please try again or contact support.' });
    }
    return res.status(500).json({ error: 'System error. Failed to create payment order.' });
  }
}
