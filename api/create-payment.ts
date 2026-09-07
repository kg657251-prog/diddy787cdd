export const config = {
  runtime: 'edge',
};

const SUNPAYS_API_KEY = process.env.SUNPAYS_API_KEY || 'ecee0739b16abec50862a78185b881e3f1772c8bd5dced5b';
const SUNPAYS_API_SECRET = process.env.SUNPAYS_API_SECRET || '59750f656226f2dbb23518500a3c99a8f3207bdab4f3964c20ac89170628c105';
const SUNPAYS_BASE_URL = 'https://sunpaytm.quest/api/public/v1/payins';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function generateHmacSha256(secret: string, payload: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

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

    const host = req.headers.get('host') || 'cardinguc.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const orderId = `CUC${Date.now()}${randomSuffix}`;

    const amount = Math.round(parseFloat(price));

    const bodyObj: Record<string, any> = {
      order_id: orderId,
      amount: amount,
      currency: 'INR',
      method: 'upi',
      customer_name: name || 'BGMI Player',
      customer_phone: phone || '9999999999',
      customer_email: email || 'player@cardinguc.com',
      notify_url: `${siteUrl}/api/payment-callback`,
      metadata: { player_id: playerId, package_id: packageId }
    };

    const rawBody = JSON.stringify(bodyObj);
    const signature = await generateHmacSha256(SUNPAYS_API_SECRET.trim(), rawBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for speed

    const response = await fetch(SUNPAYS_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUNPAYS_API_KEY.trim(),
        'x-signature': signature,
      },
      body: rawBody,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    const data = await response.json();
    
    const checkoutUrl =
      data?.checkout_url ||
      data?.payment_url ||
      data?.redirect_url ||
      data?.transaction?.gateway_payment_url ||
      data?.merchant_gateway_payment_url;

    if ((response.status === 200 || response.status === 201) && checkoutUrl) {
      return new Response(JSON.stringify({ success: true, paymentUrl: checkoutUrl, orderId }), {
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
