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

    // Extract user_auth cookie using multiple approaches
    let userAuthCookieValue = "";

    // Approach 1: Try getSetCookie() (Node 20+, available on Vercel)
    try {
      const setCookies = (tokenResponse.headers as any).getSetCookie?.();
      if (setCookies && Array.isArray(setCookies) && setCookies.length > 0) {
        console.log(`getSetCookie() returned ${setCookies.length} cookies`);
        for (const cookieStr of setCookies) {
          const match = cookieStr.match(/^user_auth=([^;]+)/);
          if (match) {
            userAuthCookieValue = match[1];
            console.log("Found user_auth via getSetCookie()");
            break;
          }
        }
      }
    } catch (e) {
      console.log("getSetCookie() not available, falling back");
    }

    // Approach 2: Extract from raw set-cookie header using regex
    if (!userAuthCookieValue) {
      const rawCookie = tokenResponse.headers.get('set-cookie') || '';
      console.log(`Raw set-cookie header length: ${rawCookie.length}`);
      
      // Directly search for user_auth= in the raw header string
      const authMatch = rawCookie.match(/user_auth=([^;]+)/);
      if (authMatch) {
        userAuthCookieValue = authMatch[1];
        console.log("Found user_auth via regex extraction from raw header");
      }
    }

    if (!userAuthCookieValue) {
      console.error("No user_auth cookie found in any approach");
      return res.status(502).json({ 
        success: false, 
        error: "Verification service temporarily unavailable. Please try again." 
      });
    }

    // Decode the cookie to extract accessToken
    let accessToken = "";
    try {
      const decoded = decodeURIComponent(userAuthCookieValue);
      const parsed = JSON.parse(decoded);
      accessToken = parsed.accessToken || "";
      console.log("Got access token:", accessToken ? "yes (length: " + accessToken.length + ")" : "no");
    } catch (e) {
      console.error("Failed to parse user_auth cookie. Raw value length:", userAuthCookieValue.length);
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
