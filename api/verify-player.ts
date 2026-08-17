export const config = {
  runtime: 'edge',
};

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'b9172a8c93msh580d2723f591e4bp1b75a7jsnbe815744d293';
const RAPIDAPI_HOST = 'id-game-checker.p.rapidapi.com';

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

    const apiUrl = `https://${RAPIDAPI_HOST}/bgmi/${trimmedId}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await apiResponse.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Verification service returned invalid response.',
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (data.status === 200 && data.data?.username) {
      return new Response(JSON.stringify({
        success: true,
        name: data.data.username,
        message: 'ID Verified',
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: 'Player not found. Please check your BGMI UID.',
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to verify player ID. Please try again later.',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
