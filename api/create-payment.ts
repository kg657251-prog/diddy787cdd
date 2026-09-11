export const config = {
  runtime: 'edge',
};

const BONDPAYS_CONFIG = {
  baseUrl: 'https://api.bond-payss.com/v1/create',
  merchantId: process.env.BONDPAYS_MERCHANT_ID || '100888216',
  apiKey: process.env.BONDPAYS_API_KEY || 'ad4f9f40e0f9a59190ea89eb9544f831',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function md5Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hashBuffer))
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
    const body = await req.json();
    const { playerId, packageId, price } = body;

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
    const merchantOrderNo = `ORDER_${Date.now()}_${randomSuffix}`;
    const formattedAmount = parseFloat(price).toFixed(2);
    const callbackUrl = `${siteUrl}/api/payment-callback`;

    // BondPays signature: md5(merchant_id + amount + merchant_order_no + api_key + callback_url)
    const signString = `${BONDPAYS_CONFIG.merchantId}${formattedAmount}${merchantOrderNo}${BONDPAYS_CONFIG.apiKey}${callbackUrl}`;
    const signature = await md5Hex(signString);

    const requestBody = {
      merchant_id: BONDPAYS_CONFIG.merchantId,
      api_key: BONDPAYS_CONFIG.apiKey,
      amount: formattedAmount,
      merchant_order_no: merchantOrderNo,
      callback_url: callbackUrl,
      extra: `${playerId}`,
      signature: signature,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(BONDPAYS_CONFIG.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (data && data.success === true && data.payment_url) {
      return new Response(JSON.stringify({ success: true, paymentUrl: data.payment_url, orderId: merchantOrderNo }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorMsg = data?.message || data?.error || 'Payment gateway returned an error. Please try again.';
      return new Response(JSON.stringify({ success: false, error: errorMsg, orderId: merchantOrderNo }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
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
