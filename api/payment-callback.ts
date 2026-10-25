import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const GATEWAY_SECRET = process.env.PAYMENT_SECRET || 'e29816ea4c985fe2aae6e0e323b90954';

function verifySign(params: any, secret: string) {
  const receivedSign = params.sign;
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'sign' && params[k] !== '' && params[k] != null)
    .sort();

  const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + `&key=${secret}`;
  const expectedSign = createHash('md5').update(signStr).digest('hex');

  return receivedSign === expectedSign;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    // Verify signature
    if (params.sign) {
      const isValid = verifySign(params, GATEWAY_SECRET);
      if (!isValid) {
        console.error('[payment-callback] Invalid signature!');
        return res.status(400).json({ status: 'error', message: 'Invalid signature' });
      }
    }

    // Extract order details
    const merchantOrderId = params.merchant_order_id || params.out_trade_no || params.orderId || '';
    const status = params.status || params.trade_status || params.order_status || '';
    const amount = params.amount || params.total_amount || '';
    const gatewayOrderId = params.order_id || params.trade_no || params.transaction_id || '';

    console.log(`[payment-callback] Order: ${merchantOrderId}, Status: ${status}, Amount: ${amount}, Gateway ID: ${gatewayOrderId}`);

    // Process the payment result
    if (status === 'success' || status === 'paid' || status === 'TRADE_SUCCESS' || status === '1' || status === 'completed') {
      console.log(`[payment-callback] Payment SUCCESS for order: ${merchantOrderId}`);
    } else {
      console.log(`[payment-callback] Payment status ${status} for order: ${merchantOrderId}`);
    }

    // Respond with success to acknowledge receipt
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send('success');
  } catch (error) {
    console.error('[payment-callback] Error processing callback:', error);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
}
