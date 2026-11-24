import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

const DIVINEPAY_WEBHOOK_SECRET = process.env.DIVINEPAY_WEBHOOK_SECRET || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-divinepay-signature');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Accept both POST and GET callbacks
  let params: any;
  if (req.method === 'POST') {
    params = req.body;
  } else if (req.method === 'GET') {
    params = req.query;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log(`[payment-callback] Received callback:`, JSON.stringify(params));

  try {
    // Divine Pay Webhook Signature Verification (if secret is configured)
    const signature = req.headers['x-divinepay-signature'] as string;
    if (signature && DIVINEPAY_WEBHOOK_SECRET) {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const expectedSign = createHmac('sha256', DIVINEPAY_WEBHOOK_SECRET)
        .update(rawBody, 'utf8')
        .digest('hex');

      if (signature.toLowerCase() !== expectedSign.toLowerCase()) {
        console.error('[payment-callback] Divine Pay signature mismatch');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    // Extract fields (supports Divine Pay and generic gateways)
    const orderId = params.order_id || params.orderId || params.merchant_order_id || '';
    const status = (params.status || params.trade_status || '').toLowerCase();
    const amount = params.realAmount || params.orderAmount || params.amount || '';
    const utr = params.utr || '';

    console.log(`[payment-callback] Order ID: ${orderId}, Status: ${status}, Amount: ${amount}, UTR: ${utr}`);

    // Return webhook acknowledgment
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[payment-callback] Error processing callback:', error);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
}