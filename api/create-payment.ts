import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import axios from 'axios';

const GATEWAY_CONFIG = {
  baseUrl: 'https://api.watchpays.com/v1/create',
  merchantId: process.env.WATCHPAYS_MERCHANT_ID || '100555238',
  apiKey: process.env.WATCHPAYS_API_KEY || '8f0b68cd9c73c0db0131d86da6def792',
};

function generateSignature(merchant_id: string, amount: string, merchant_order_no: string, callback_url: string, apiKey: string) {
  const params: any = {
    merchant_id,
    amount,
    merchant_order_no,
    callback_url
  };

  const sortedKeys = Object.keys(params).sort();
  let signStr = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
  signStr += `&key=${apiKey}`;

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
    const { playerId, packageId, amount, price, name, email, phone } = req.body;

    if (!playerId || !packageId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine absolute site URL for callback
    const host = req.headers.host || 'cardinguc.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;
    const callbackUrl = `${siteUrl}/api/payment-callback`;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const merchantOrderNo = `ORD${Date.now()}${randomSuffix}`;
    const formattedAmount = parseFloat(price).toFixed(2);

    const signature = generateSignature(
      GATEWAY_CONFIG.merchantId,
      formattedAmount,
      merchantOrderNo,
      callbackUrl,
      GATEWAY_CONFIG.apiKey
    );

    const requestBody = {
      merchant_id: GATEWAY_CONFIG.merchantId,
      api_key: GATEWAY_CONFIG.apiKey,
      amount: formattedAmount,
      merchant_order_no: merchantOrderNo,
      callback_url: callbackUrl,
      extra: `${playerId}`,
      signature: signature,
    };

    console.log(`[create-payment] Initiating payment request to ${GATEWAY_CONFIG.baseUrl}`);
    console.log(`[create-payment] Order: ${merchantOrderNo}, Amount: \u20b9${formattedAmount}, Callback: ${callbackUrl}`);

    const response = await axios.post(GATEWAY_CONFIG.baseUrl, requestBody, {
      timeout: 10000, // 10s timeout
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true, // Don't throw on 4xx/5xx to log the response
    });

    console.log(`[create-payment] Gateway status: ${response.status}`);
    console.log(`[create-payment] Gateway response:`, JSON.stringify(response.data));

    const data = response.data;

    if (data && data.success === true && data.payment_url) {
      return res.status(200).json({
        success: true,
        paymentUrl: data.payment_url,
        orderId: merchantOrderNo,
      });
    } else {
      const errorMsg = data?.message || 'Payment gateway returned an error. Please try again.';
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
