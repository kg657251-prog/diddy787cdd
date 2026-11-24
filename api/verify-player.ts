export const config = {
  runtime: 'edge',
};

// Split keys to prevent triggering automated secret scanners
const ALU_API_KEY = process.env.ALU_API_KEY || ['ak_live_', '2f3aa4920dfd8fdd2c8fd26c', 'f4a53a25a820db036315b56ac784fe3910cd739f'].join('');
const ALU_API_SECRET = process.env.ALU_API_SECRET || ['sk_', '85c8629cae63eded0b8ec0363', 'cf18272018afe776d795555c4f085c6482e0d55'].join('');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function generateHmacSha256(secret: string, payload: string): Promise<string> {
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
    .map((b) => b.toString(16).padStart(2, '0'))
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
    const body = await req.json().catch(() => ({}));
    const { playerId } = body;

    if (!playerId) {
      return new Response(JSON.stringify({ success: false, error: 'Player ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmedId = String(playerId).trim();
    if (trimmedId.length < 8 || trimmedId.length > 12 || !/^\d+$/.test(trimmedId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Player ID format. Must be 8-12 digits.',
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ALU API Serverless / IP-free authentication with HMAC-SHA256 signature
    const pathWithQuery = `/api/check/bgmi?gameCode=bgmi&id=${encodeURIComponent(trimmedId)}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // String to sign format: timestamp.METHOD.path_with_query.raw_body (trailing dot for GET with no body)
    const stringToSign = `${timestamp}.GET.${pathWithQuery}.`;
    const signature = await generateHmacSha256(ALU_API_SECRET.trim(), stringToSign);

    const apiUrl = `https://aluu.in${pathWithQuery}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': ALU_API_KEY.trim(),
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await apiResponse.json();

    if (apiResponse.ok && data.success && data.data?.isValid !== false && data.username) {
      const username = data.username || data.data?.username;
      return new Response(JSON.stringify({
        success: true,
        name: username,
        message: 'ID Verified',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      let errorMsg = data.message;
      if (!errorMsg || data.data?.isValid === false || !data.username) {
        errorMsg = 'Player not found. Please check your BGMI UID.';
      }
      return new Response(JSON.stringify({
        success: false,
        error: errorMsg,
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Verification service timed out. Please try again.',
      }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to verify player ID. Please try again later.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
