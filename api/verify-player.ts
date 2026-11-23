export const config = {
  runtime: 'edge',
};

const NEFERBYTE_API_KEY = process.env.NEFERBYTE_API_KEY || ['7e7fd9cae78a542b', 'f3ba679f94a5afa2'].join('');
const NEFERBYTE_BASE_URL = 'https://api.neferbyte.com/game-id-checker/bgmi';

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
    const body = await req.json();
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

    const apiUrl = `${NEFERBYTE_BASE_URL}/${encodeURIComponent(trimmedId)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-api-key': NEFERBYTE_API_KEY.trim(),
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await apiResponse.json();

    if (!data.error && data.data && data.data.username) {
      return new Response(JSON.stringify({
        success: true,
        name: data.data.username,
        message: 'ID Verified',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errorMsg =
        data.msg === 'id_not_found'
          ? 'Player not found. Please check your BGMI UID.'
          : data.msg === 'numeric_id_type'
          ? 'Invalid ID format. Must be numeric.'
          : data.msg || 'Player not found. Please check your BGMI UID.';

      return new Response(JSON.stringify({
        success: false,
        error: errorMsg,
      }), {
        status: 200,
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
