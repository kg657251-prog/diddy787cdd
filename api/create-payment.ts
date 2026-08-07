import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import axios from 'axios';

// SunPays Fire credentials
const SUNPAYS_API_KEY = process.env.SUNPAYS_API_KEY || 'ecee0739b16abec50862a78185b881e3f1772c8bd5dced5b';
const SUNPAYS_API_SECRET = process.env.SUNPAYS_API_SECRET || '59750f656226f2dbb23518500a3c99a8f3207bdab4f3964c20ac891';
const SUNPAYS_BASE_URL = 'https://sunpaytm.quest/api/public/v1/payins';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { playerId, packageId, price, name, email, phone } = req.body;

    if (!playerId || !packageId || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const host = req.headers.host || 'cardinguc.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderId = `CUC${Date.now()}${randomSuffix}`;
    const formattedAmount = parseFloat(price);

    // Build body object - matches SunPays docs exactly
    const bodyObj: Record<string, any> = {
      order_id: orderId,
      amount: formattedAmount,
      currency: 'INR',
      method: 'upi',
      customer_name: name || 'BGMI Player',
      customer_phone: phone || '9999999999',
      customer_email: email || 'player@cardinguc.com',
      notify_url: `${siteUrl}/api/payment-callback`,
      metadata: { player_id: playerId, package_id: packageId }
    };

    // CRITICAL: Stringify ONCE — use this exact string for BOTH signature and request body
    const rawBody = JSON.stringify(bodyObj);

    // HMAC-SHA256(rawBody, api_secret) as hex
    const signature = createHmac('sha256', SUNPAYS_API_SECRET)
      .update(rawBody)
      .digest('hex');

    console.log(`[SunPays] Order: ${orderId} | Amount: ${formattedAmount} | URL: ${SUNPAYS_BASE_URL}`);
    console.log(`[SunPays] Raw body: ${rawBody}`);
    console.log(`[SunPays] Signature: ${signature}`);

    // Send the EXACT same rawBody string — do NOT let axios re-serialize
    const response = await axios.post(SUNPAYS_BASE_URL, rawBody, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUNPAYS_API_KEY,
        'x-signature': signature,
      },
      validateStatus: () => true,
    });

    const data = response.data;
    console.log(`[SunPays] HTTP Status: ${response.status}`);
    console.log(`[SunPays] Response: ${JSON.stringify(data)}`);

    // Extract checkout URL from any field SunPays returns it in
    const checkoutUrl =
      data?.checkout_url ||
      data?.payment_url ||
      data?.redirect_url ||
      data?.transaction?.gateway_payment_url ||
      data?.merchant_gateway_payment_url;

    if ((response.status === 200 || response.status === 201) && checkoutUrl) {
      return res.status(200).json({
        success: true,
        paymentUrl: checkoutUrl,
        orderId,
      });
    }

    const errorMsg = data?.message || data?.error || data?.detail || `Gateway error (HTTP ${response.status})`;
    console.error(`[SunPays] Error: ${errorMsg}`);
    return res.status(200).json({ success: false, error: errorMsg, orderId });

  } catch (error: any) {
    console.error('[SunPays] Exception:', error.message);
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return res.status(500).json({ error: 'Payment gateway timed out. Please try again.' });
    }
    return res.status(500).json({ error: `System error: ${error.message}` });
  }
}
