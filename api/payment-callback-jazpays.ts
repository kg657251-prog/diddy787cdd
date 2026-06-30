import { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

const GATEWAY_SECRET = process.env.JAZPAYS_API_KEY || 'b54849355bc9fe4b4ab33923e251c89d';

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

  console.log(`[jazpays-callback] Received callback:`, JSON.stringify(params));

  try {
    const { orderNo, merchantOrder, status, amount, signature } = params;

    console.log(`[jazpays-callback] Order: ${merchantOrder}, Status: ${status}, Amount: ${amount}, Gateway ID: ${orderNo}`);

    if (status === 'success') {
      console.log(`[jazpays-callback] Payment SUCCESS for order: ${merchantOrder}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('success');
    } else {
      console.log(`[jazpays-callback] Payment status ${status} for order: ${merchantOrder}`);
      res.setHeader('Content-Type', 'text/plain');
      return res.status(200).send('failed');
    }
  } catch (error) {
    console.error('[jazpays-callback] Error processing callback:', error);
    return res.status(500).json({ error: 'Callback processing failed' });
  }
}
