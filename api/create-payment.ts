export const config = {
  runtime: 'edge',
};

const DIVINEPAY_API_KEY = process.env.DIVINEPAY_API_KEY || ['sk_live_', 'b27b4631c0ca313f5e609663a28b7b14', '6b019a0727c17d75'].join('');
const DIVINEPAY_BASE_URL = 'https://divinepay.us.cc/api/payin/payin/create';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const bodyObjOriginal = await req.json();
    const { playerId, packageId, price, name, email, phone } = bodyObjOriginal;

    if (!playerId || !packageId || !price) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderId = `CUC${Date.now()}${randomSuffix}`;

    const amount = Math.round(parseFloat(price));

    const bodyObj = {
      amount: amount,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(DIVINEPAY_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': DIVINEPAY_API_KEY.trim(),
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    
    // Divine Pay returns: { success: true, data: { order_id, paymentUrl } }
    const checkoutUrl =
      data?.data?.paymentUrl ||
      data?.paymentUrl ||
      data?.data?.payment_url ||
      data?.checkout_url ||
      data?.payment_url ||
      data?.redirect_url;

    if ((response.status === 200 || response.status === 201) && data?.success && checkoutUrl) {
      return new Response(JSON.stringify({ success: true, paymentUrl: checkoutUrl, orderId: data?.data?.order_id || orderId }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const errorMsg = data?.message || data?.error || data?.detail || `Gateway error (HTTP ${response.status})`;
    return new Response(JSON.stringify({ success: false, error: errorMsg, orderId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'Payment gateway timed out. Please try again.' }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: `System error: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
