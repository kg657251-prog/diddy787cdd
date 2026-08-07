import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

// SunPays Fire credentials
const SUNPAYS_CONFIG = {
  baseUrl: 'https://api.sunpaytm.site/api/public/v1/payins',
  merchantId: process.env.SUNPAYS_MERCHANT_ID || '40794632',
  apiKey: process.env.SUNPAYS_API_KEY || 'ecee0739b16abec50862a78185b881e3f1772c8bd5dced5b',
  apiSecret: process.env.SUNPAYS_API_SECRET || '59750f656226f2dbb23518500a3c99a8f3207bdab4f3964c20ac891',
};

function generateSignature(body: object, secret: string): string {
  const bodyStr = JSON.stringify(body);
  return createHmac('sha256', secret).update(bodyStr).digest('hex');
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

    // Build absolute site URL
    const host = req.headers.host || 'cardinguc.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    // Generate unique order ID
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderId = `CUC${Date.now()}${randomSuffix}`;
    const formattedAmount = parseFloat(price);

    // Map payment method to SunPays supported method
    let method = 'upi';
    if (paymentMethod === 'bank') method = 'bank';

    const notifyUrl = `${siteUrl}/api/payment-callback`;

    // Build request body
    const requestBody: Record<string, any> = {
      order_id: orderId,
      amount: formattedAmount,
      currency: 'INR',
      method: method,
      customer_name: name || 'BGMI Player',
      customer_phone: phone || '9999999999',
      customer_email: email || 'player@cardinguc.com',
      notify_url: notifyUrl,
      metadata: {
        player_id: playerId,
        package_id: packageId,
      }
    };

    // Generate HMAC-SHA256 signature
    const signature = generateSignature(requestBody, SUNPAYS_CONFIG.apiSecret);

    console.log(`[SunPays] Creating order: ${orderId}, Amount: Rs.${formattedAmount}`);

    const response = await fetch(SUNPAYS_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUNPAYS_CONFIG.apiKey,
        'x-signature': signature,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000),
    });

    const data: any = await response.json();

    console.log(`[SunPays] Gateway status: ${response.status}`);
    console.log(`[SunPays] Gateway response:`, JSON.stringify(data));

    // SunPays returns checkout_url / payment_url on success (status 201)
    if (response.status === 201 || response.ok) {
      const checkoutUrl = data?.checkout_url || data?.payment_url || data?.redirect_url || data?.transaction?.gateway_payment_url;
      if (checkoutUrl) {
        return res.status(200).json({
          success: true,
          paymentUrl: checkoutUrl,
          orderId: orderId,
        });
      }
    }

    // Error from SunPays
    const errorMsg = data?.message || data?.error || 'Payment gateway error. Please try again.';
    console.error(`[SunPays] Error:`, errorMsg, data);
    return res.status(200).json({
      success: false,
      error: errorMsg,
      orderId: orderId,
    });

  } catch (error: any) {
    console.error('[SunPays] Exception:', error.message);
    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      return res.status(500).json({ error: 'Payment gateway timed out. Please try again.' });
    }
    return res.status(500).json({ error: 'System error. Failed to create payment order.' });
  }
}
