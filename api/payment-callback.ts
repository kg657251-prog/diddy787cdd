import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = process.env.DIVINEPAY_WEBHOOK_SECRET || '';

function verifyDivinePaySignature(body: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return true; // Skip verification if no secret configured
  const expectedSignature = createHmac('sha256', secret).update(body).digest('hex');
  return signature === expectedSignature;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Accept both POST and GET callbacks
  let params: any;
  let rawBody = '';
  if (req.method === 'POST') {
    params = req.body;
    rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  } else if (req.method === 'GET') {
    params = req.query;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log(`[payment-callback] Received callback:`, JSON.stringify(params));

  try {
    // Verify Divine Pay HMAC-SHA256 signature (x-divinepay-signature header)
    const signature = req.headers['x-divinepay-signature'] as string;
    if (signature && WEBHOOK_SECRET) {
      const isValid = verifyDivinePaySignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error('[payment-callback] Invalid Divine Pay signature!');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
      }
    }

    // Extract order details - handle Divine Pay response format
    const orderId = params.order_id || params.orderId || params.merchant_order_id || params.out_trade_no || '';
    const status = params.status || params.trade_status || params.order_status || '';
    const amount = params.amount || params.total_amount || '';
    const transactionId = params.transaction_id || params.trade_no || params.gateway_order_id || '';

    console.log(`[payment-callback] Order: ${orderId}, Status: ${status}, Amount: ${amount}, Transaction ID: ${transactionId}`);

    // Process the payment result - Divine Pay uses 'success' and 'failed' statuses
    if (status === 'success' || status === 'paid' || status === 'completed' || status === 'TRADE_SUCCESS' || status === '1') {
      console.log(`[payment-callback] Payment SUCCESS for order: ${orderId}`);
    } else if (status === 'failed') {
      console.log(`[payment-callback] Payment FAILED for order: ${orderId}`);
    } else {
      console.log(`[payment-callback] Payment status ${status} for order: ${orderId}`);
    }

    // Respond with success to acknowledge receipt (Divine Pay expects { "success": true })
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[payment-callback] Error processing callback:', error);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
}
