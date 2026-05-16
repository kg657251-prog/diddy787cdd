import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { playerId } = req.body;
  
  if (!playerId) {
    return res.status(400).json({ error: "Player ID is required" });
  }

  // Validate format: 8-12 digit numeric string
  if (playerId.length < 8 || playerId.length > 12 || !/^\d+$/.test(playerId)) {
    return res.status(400).json({ 
      success: false, 
      error: "Invalid Player ID format. Must be 8-12 digits." 
    });
  }

  try {
    console.log(`Verifying Player ID: ${playerId}`);

    // Step 1: Get authorization token from rooter.gg
    const tokenResponse = await fetch("https://www.rooter.gg/", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    // Extract user_auth cookie from response
    const setCookieHeaders = tokenResponse.headers.getSetCookie?.() || [];
    let userAuthCookie = "";
    let allCookies: string[] = [];

    // Try getSetCookie() first, then fall back to get('set-cookie')
    let cookieHeaders: string[] = [];
    if (setCookieHeaders.length > 0) {
      cookieHeaders = setCookieHeaders;
    } else {
      const rawSetCookie = tokenResponse.headers.get('set-cookie');
      if (rawSetCookie) {
        cookieHeaders = rawSetCookie.split(/,(?=\s*\w+=)/);
      }
    }

    for (const cookie of cookieHeaders) {
      // Collect all cookies for forwarding
      const cookiePair = cookie.split(';')[0].trim();
      allCookies.push(cookiePair);
      
      if (cookie.trim().startsWith('user_auth=')) {
        const match = cookie.match(/user_auth=([^;]+)/);
        if (match) {
          userAuthCookie = match[1];
        }
      }
    }

    if (!userAuthCookie) {
      console.error("Failed to get user_auth cookie from rooter.gg");
      return res.status(502).json({ 
        success: false, 
        error: "Verification service temporarily unavailable. Please try again." 
      });
    }

    // Decode the cookie to extract accessToken
    let accessToken = "";
    try {
      const decoded = decodeURIComponent(userAuthCookie);
      const parsed = JSON.parse(decoded);
      accessToken = parsed.accessToken || "";
    } catch (e) {
      console.error("Failed to parse user_auth cookie:", e);
      return res.status(502).json({ 
        success: false, 
        error: "Verification service temporarily unavailable. Please try again." 
      });
    }

    if (!accessToken) {
      console.error("No accessToken found in user_auth cookie");
      return res.status(502).json({ 
        success: false, 
        error: "Verification service temporarily unavailable. Please try again." 
      });
    }

    // Step 2: Query the BGMI username API
    const apiUrl = `https://bazaar.rooter.io/order/getUnipinUsername?gameCode=BGMI_IN&id=${playerId}`;
    
    const apiResponse = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Device-Type": "web",
        "App-Version": "1.0.0",
        "Device-Id": "cardinguc-verifier",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Cookie": allCookies.join('; '),
      },
    });

    const data = await apiResponse.json();
    console.log("API Response:", JSON.stringify(data));

    if (data.transaction === "SUCCESS" && data.unipinRes?.username) {
      return res.status(200).json({ 
        success: true, 
        name: data.unipinRes.username,
        message: "ID Verified" 
      });
    } else {
      // Player not found or invalid ID
      return res.status(404).json({ 
        success: false, 
        error: data.message || "Player not found. Please check your BGMI UID." 
      });
    }

  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to verify player ID. Please try again later." 
    });
  }
}
