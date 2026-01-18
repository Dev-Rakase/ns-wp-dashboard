import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * CORS headers for public API endpoints
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Get Messenger connection status and details for a website
 * Called by WordPress plugin to check connection status and token expiration
 * Public endpoint - requires license_key and domain validation
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get("license_key");
    const domain = searchParams.get("domain");

    if (!licenseKey || !domain) {
      return NextResponse.json(
        { success: false, error: "Missing license_key or domain" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find website by license key and domain
    const website = await prisma.website.findFirst({
      where: {
        licenseKey: licenseKey,
        domain: domain,
      },
      select: {
        id: true,
        messengerEnabled: true,
        tokenExpiresAt: true,
        facebookPageId: true,
        facebookPageName: true,
        facebookPageAccessToken: true,
      },
    });

    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (
      !website.messengerEnabled ||
      !website.tokenExpiresAt ||
      !website.facebookPageId
    ) {
      return NextResponse.json(
        {
          success: true,
          messengerEnabled: false,
          tokenExpiresAt: null,
          facebookPageId: null,
          facebookPageName: null,
        },
        { headers: corsHeaders }
      );
    }

    // Use stored page name from database first
    // Only fetch from Facebook API if not stored (for backward compatibility)
    let facebookPageName: string | null = website.facebookPageName || null;

    // If page name is not stored, try to fetch from Facebook Graph API as fallback
    // Note: This is only for backward compatibility with existing connections
    // New connections will have the page name stored during OAuth callback
    // This API call may fail due to permissions, but that's okay - page name is not critical
    if (
      !facebookPageName &&
      website.facebookPageAccessToken &&
      website.facebookPageId
    ) {
      try {
        const pageInfoUrl = `https://graph.facebook.com/v24.0/${website.facebookPageId}?fields=name&access_token=${website.facebookPageAccessToken}`;
        const pageInfoResponse = await fetch(pageInfoUrl);

        if (pageInfoResponse.ok) {
          const pageInfo = await pageInfoResponse.json();

          // Check for Facebook API errors
          if (pageInfo.error) {
            console.warn(
              `Facebook API error fetching page name:`,
              pageInfo.error
            );
            // This is not critical - we can continue without page name
          } else if (pageInfo.name) {
            facebookPageName = pageInfo.name;

            // Optionally update the database with the fetched name (async, don't wait)
            // This helps for existing connections that don't have the name stored
            prisma.website
              .update({
                where: { id: website.id },
                data: { facebookPageName: pageInfo.name },
              })
              .catch((err) => {
                console.error("Failed to update page name in database:", err);
              });
          }
        } else {
          // Log the error response but continue
          const errorData = await pageInfoResponse.json().catch(() => ({}));
          console.warn(
            `Failed to fetch Facebook page name (HTTP ${pageInfoResponse.status}):`,
            errorData
          );
          // This is not critical - we can continue without page name
        }
      } catch (error) {
        console.warn("Error fetching Facebook page name:", error);
        // Continue without page name if fetch fails - this is not critical
      }
    }

    // Return token expiration as ISO string with CORS headers
    return NextResponse.json(
      {
        success: true,
        messengerEnabled: true,
        tokenExpiresAt: website.tokenExpiresAt.toISOString(),
        facebookPageId: website.facebookPageId,
        facebookPageName: facebookPageName,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error fetching messenger status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
