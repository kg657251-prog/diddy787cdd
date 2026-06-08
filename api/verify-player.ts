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
      redirect: "follow",
    });

    // Extract cookies from response headers
    // Use multiple approaches for compatibility across Node.js versions
    let userAuthCookie = "";
    let allCookies: string[] = [];

    // Approach 1: Try getSetCookie() (Node 20+)
    let cookieStrings: string[] = [];
    try {
      const setCookieResult = (tokenResponse.headers as any).getSetCookie?.();
      if (setCookieResult && setCookieResult.length > 0) {
        cookieStrings = setCookieResult;
      }
    } catch (e) {
      // getSetCookie not available
    }

    // Approach 2: Fall back to raw header
    if (cookieStrings.length === 0) {
      const rawCookie = tokenResponse.headers.get('set-cookie');
      if (rawCookie) {
        // Split on comma but not within cookie values (rough heuristic)
        cookieStrings = rawCookie.split(/,(?=[^ ])/);
      }
    }

    console.log(`Found ${cookieStrings.length} cookies from rooter.gg`);

    for (const cookie of cookieStrings) {
      const cookiePair = cookie.split(';')[0].trim();
      allCookies.push(cookiePair);
      
      if (cookiePair.startsWith('user_auth=')) {
        userAuthCookie = cookiePair.replace('user_auth=', '');
      }
    }

    if (!userAuthCookie) {
      console.error("No user_auth cookie found. Cookies received:", allCookies.map(c => c.split('=')[0]));
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
      console.log("Got access token:", accessToken ? "yes (length: " + accessToken.length + ")" : "no");
    } catch (e) {
      console.error("Failed to parse user_auth cookie. Raw value length:", userAuthCookie.length);
      return res.status(502).json({ 
        success: false, 
        error: "Verification service temporarily unavailable. Please try again." 
      });
    }

    if (!accessToken) {
      console.error("Empty accessToken after parsing");
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
        "Device-Id": "web-verifier",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Cookie": allCookies.join('; '),
      },
    });

    const responseText = await apiResponse.text();
    console.log("API Response status:", apiResponse.status, "body:", responseText.substring(0, 500));

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse API response as JSON");
      return res.status(502).json({ 
        success: false, 
        error: "Verification service returned invalid response. Please try again." 
      });
    }

    if (data.transaction === "SUCCESS" && data.unipinRes?.username) {
      return res.status(200).json({ 
        success: true, 
        name: data.unipinRes.username,
        message: "ID Verified" 
      });
    } else {
      return res.status(404).json({ 
        success: false, 
        error: data.message || "Player not found. Please check your BGMI UID." 
      });
    }

  } catch (error: any) {
    console.error("Verification error:", error?.message || error);
    return res.status(500).json({ 
      success: false,
      error: "Failed to verify player ID. Please try again later." 
    });
  }
}
