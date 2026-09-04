export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Fetches a fresh access token from rooter.gg by reading the user_auth cookie.
 */
async function getRooterAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('https://www.rooter.gg/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    // Extract user_auth cookie from Set-Cookie headers
    const setCookieHeaders = res.headers.getSetCookie?.() ?? [];
    // Fallback: some runtimes expose it differently
    const rawSetCookie = setCookieHeaders.length > 0
      ? setCookieHeaders
      : (res.headers.get('set-cookie') || '').split(/,(?=\s*\w+=)/).filter(Boolean);

    for (const cookie of rawSetCookie) {
      const match = cookie.match(/user_auth=([^;]+)/);
      if (match) {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded);
        return parsed.accessToken || null;
      }
    }

    return null;
  } catch {
    return null;
  }
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
    const { playerId } = body;

    if (!playerId) {
      return new Response(JSON.stringify({ error: 'Player ID is required' }), {
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

    // Step 1: Get access token from rooter.gg
    const accessToken = await getRooterAccessToken();

    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Unable to authenticate with verification service.',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Fetch BGMI username using the token
    const apiUrl = `https://bazaar.rooter.io/order/getUnipinUsername?gameCode=BGMI_IN&id=${trimmedId}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Device-Type': 'web',
        'App-Version': '1.0.0',
        'Device-Id': 'web-client',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await apiResponse.json();

    if (data.transaction === 'SUCCESS' && data.unipinRes?.username) {
      return new Response(JSON.stringify({
        success: true,
        name: data.unipinRes.username,
        message: 'ID Verified',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: data.message || 'Player not found. Please check your BGMI UID.',
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
