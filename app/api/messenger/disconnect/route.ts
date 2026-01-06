import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  syncCreditsWithCloudflare,
  invalidatePageIdCache,
} from "@/lib/cloudflare";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";

/**
 * Disconnect Facebook Messenger for a website
 * Public endpoint - accepts domain and license key from WordPress
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, license_key } = body;

    if (!domain || !license_key) {
      return NextResponse.json(
        { success: false, error: "Domain and license_key are required" },
        { status: 400 }
      );
    }

    // Validate license key and get website
    const website = await prisma.website.findUnique({
      where: {
        licenseKey: license_key,
      },
    });

    if (!website || website.domain !== domain) {
      return NextResponse.json(
        { success: false, error: "Invalid license key or domain mismatch" },
        { status: 403 }
      );
    }

    if (!website.facebookPageId || !website.facebookPageAccessToken) {
      return NextResponse.json(
        { success: false, error: "Facebook Messenger is not connected" },
        { status: 400 }
      );
    }

    // Unsubscribe page from webhook events
    try {
      const unsubscribeUrl = `https://graph.facebook.com/v24.0/${website.facebookPageId}/subscribed_apps?access_token=${website.facebookPageAccessToken}`;
      const unsubscribeResponse = await fetch(unsubscribeUrl, {
        method: "DELETE",
      });

      if (!unsubscribeResponse.ok) {
        const errorData = await unsubscribeResponse.json();
        console.error("Facebook webhook unsubscription error:", errorData);
        // Continue even if unsubscription fails
      }
    } catch (unsubscribeError) {
      console.error("Error unsubscribing from webhooks:", unsubscribeError);
      // Continue - we'll clear the credentials anyway
    }

    // Clear Messenger credentials and disable
    await prisma.website.update({
      where: { id: website.id },
      data: {
        messengerEnabled: false,
        facebookPageId: null,
        facebookPageAccessToken: null,
      },
    });

    // Refresh Cloudflare DO cache
    await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsRemaining,
      plan: website.plan,
    });

    // Invalidate Page ID cache in KV
    if (website.facebookPageId) {
      await invalidatePageIdCache(website.facebookPageId);
    }

    return NextResponse.json({
      success: true,
      message: "Facebook Messenger disconnected successfully",
    });
  } catch (error) {
    console.error("Messenger disconnect error:", error);
    return NextResponse.json(
      { success: false, error: "An error occurred during disconnection" },
      { status: 500 }
    );
  }
}
