import { createHash } from "crypto";

// Helper to hash IP addresses for privacy
function hashIP(ip) {
  return createHash("sha256")
    .update(ip + process.env.IP_SALT || "default-salt")
    .digest("hex")
    .substring(0, 16);
}

// Helper to parse user agent
function parseUserAgent(userAgent) {
  const ua = userAgent || "";

  // Simple parsing - in production, consider using 'ua-parser-js' library
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  const isDesktop = !isMobile && !isTablet;

  // Browser detection
  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edge")) browser = "Edge";

  // OS detection
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    os = "iOS";

  return {
    deviceType: isDesktop ? "desktop" : isTablet ? "tablet" : "mobile",
    browser,
    os,
    isMobile,
    rawUA: ua.substring(0, 200), // Truncate for storage
  };
}

// Helper to extract UTM parameters
function extractUTMParams(url) {
  try {
    const urlObj = new URL(url);
    return {
      utm_source: urlObj.searchParams.get("utm_source"),
      utm_medium: urlObj.searchParams.get("utm_medium"),
      utm_campaign: urlObj.searchParams.get("utm_campaign"),
      utm_term: urlObj.searchParams.get("utm_term"),
      utm_content: urlObj.searchParams.get("utm_content"),
    };
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Extract visitor information
    const {
      pageUrl,
      pageTitle,
      referrer,
      screenWidth,
      screenHeight,
      sessionId,
      isNewVisitor,
      pageLoadTime,
      timestamp,
    } = req.body;

    // Get IP address (Vercel provides this)
    const ip =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress;
    const hashedIP = hashIP(ip.split(",")[0]); // Handle multiple IPs in x-forwarded-for

    // Parse headers
    const userAgent = req.headers["user-agent"];
    const acceptLanguage = req.headers["accept-language"];
    const { deviceType, browser, os, isMobile, rawUA } =
      parseUserAgent(userAgent);

    // Extract domain and path from URL
    let domain = "";
    let path = "";
    let utmParams = {};

    try {
      const url = new URL(pageUrl);
      domain = url.hostname;
      path = url.pathname;
      utmParams = extractUTMParams(pageUrl);
    } catch {
      path = pageUrl; // Fallback if URL parsing fails
    }

    // Prepare data for Notion
    const visitorData = {
      // Basic visit info
      timestamp: timestamp || new Date().toISOString(),
      pageUrl: pageUrl || "",
      pageTitle: pageTitle || "",
      path: path,
      domain: domain,

      // Traffic source
      referrer: referrer || "direct",
      referrerDomain: referrer && referrer !== "direct" ? (() => {
        try {
          return new URL(referrer).hostname;
        } catch {
          return "invalid";
        }
      })() : "direct",
      ...utmParams,

      // Device & Browser
      deviceType,
      browser,
      os,
      isMobile,
      userAgent: rawUA,
      language: acceptLanguage?.split(",")[0] || "unknown",

      // Screen info
      screenResolution:
        screenWidth && screenHeight
          ? `${screenWidth}x${screenHeight}`
          : "unknown",

      // Session info
      sessionId: sessionId || "no-session",
      isNewVisitor: isNewVisitor || false,
      hashedIP,

      // Performance
      pageLoadTime: pageLoadTime || 0,

      // Meta
      trackedAt: new Date().toISOString(),
    };

    // Log the data being sent
    console.log("Visitor data being sent to Notion:", {
      pageUrl: visitorData.pageUrl,
      pageTitle: visitorData.pageTitle,
      browser: visitorData.browser,
      referrer: visitorData.referrer,
      language: visitorData.language,
    });

    // Send to Notion
    const notionPayload = {
      parent: {
        database_id: process.env.NOTION_VISITOR_DB_ID,
      },
      properties: {
        "Page URL": {
          url: visitorData.pageUrl,
        },
        "Page Title": {
          title: [
            {
              text: { content: visitorData.pageTitle.substring(0, 100) },
            },
          ],
        },
        Browser: {
          rich_text: [
            {
              text: { content: visitorData.browser },
            },
          ],
        },
        Referrer: {
          url: visitorData.referrer === "direct" ? null : visitorData.referrer,
        },
        Language: {
          rich_text: [
            {
              text: { content: visitorData.language.substring(0, 10) },
            },
          ],
        },
      },
    };

    console.log("Notion API payload:", JSON.stringify(notionPayload, null, 2));

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify(notionPayload),
    });

    if (!notionResponse.ok) {
      const error = await notionResponse.json();
      console.error("Notion API error:", error);
      throw new Error("Failed to save to Notion");
    }

    // Return success
    res.status(200).json({
      success: true,
      message: "Visitor tracked successfully",
    });
  } catch (error) {
    console.error("Visitor tracking error:", error);

    // Still return success to not break the user experience
    res.status(200).json({
      success: false,
      message: "Tracking failed silently",
    });
  }
}
