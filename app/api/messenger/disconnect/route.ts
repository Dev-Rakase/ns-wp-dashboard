import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  invalidatePageIdCache,
  forceRefreshCloudflareCache,
} from "@/lib/cloudflare";

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
 * Disconnect Messenger integration for a website
 * Called by WordPress plugin to disconnect Facebook Page
 * Public endpoint - requires license_key and domain validation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { license_key, domain } = body;

    if (!license_key || !domain) {
      return NextResponse.json(
        { success: false, error: "Missing license key or domain" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find website by license key and domain
    const website = await prisma.website.findFirst({
      where: {
        licenseKey: license_key,
        domain: domain,
      },
      select: {
        id: true,
        facebookPageId: true,
        messengerEnabled: true,
      },
    });

    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    if (!website.messengerEnabled) {
      return NextResponse.json(
        {
          success: true,
          message: "Messenger is already disconnected",
        },
        { headers: corsHeaders }
      );
    }

    // Unsubscribe from webhooks if we have a page ID and token
    if (website.facebookPageId) {
      try {
        // Note: To unsubscribe, we would need the access token
        // For now, we'll just clear the database entries
        // Facebook will stop sending webhooks when the token is invalid
      } catch (error) {
        console.error("Error unsubscribing from webhooks:", error);
        // Continue with disconnect even if unsubscribe fails
      }

      // Invalidate KV cache
      await invalidatePageIdCache(website.facebookPageId);
    }

    // Clear Messenger settings in database
    await prisma.website.update({
      where: { id: website.id },
      data: {
        messengerEnabled: false,
        facebookPageId: null,
        facebookPageAccessToken: null,
        tokenExpiresAt: null,
      },
    });

    // Force refresh DO cache to clear Messenger credentials
    await forceRefreshCloudflareCache(domain);

    return NextResponse.json(
      {
        success: true,
        message: "Messenger disconnected successfully",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error disconnecting messenger:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
