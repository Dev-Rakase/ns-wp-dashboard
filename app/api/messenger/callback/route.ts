import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  syncCreditsWithCloudflare,
  updatePageIdCache,
  forceRefreshCloudflareCache,
} from "@/lib/cloudflare";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
const ADMIN_PANEL_URL =
  process.env.ADMIN_PANEL_URL || process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "";
const FACEBOOK_REDIRECT_URI = `${ADMIN_PANEL_URL}/api/messenger/callback`;

/**
 * Handle Facebook OAuth callback
 * Exchange code for Page Access Token and store credentials
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      const decodedState = state
        ? JSON.parse(Buffer.from(state, "base64").toString())
        : null;
      const redirectUri = decodedState?.redirect_uri || "";
      const errorUrl = new URL(redirectUri || "");
      errorUrl.searchParams.set("error", "oauth_denied");
      errorUrl.searchParams.set(
        "message",
        error === "access_denied" ? "Facebook authorization was denied" : error
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: "Missing code or state parameter" },
        { status: 400 }
      );
    }

    // Decode state to get domain and license key
    let decodedState: {
      domain: string;
      licenseKey: string;
      redirect_uri?: string;
    };
    try {
      decodedState = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    const { domain, licenseKey, redirect_uri } = decodedState;

    // Exchange code for access token
    const tokenUrl = new URL(
      "https://graph.facebook.com/v24.0/oauth/access_token"
    );
    tokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    tokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
    tokenUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "GET",
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Facebook token exchange error:", errorData);
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "token_exchange_failed");
      errorUrl.searchParams.set(
        "message",
        "Failed to exchange authorization code for access token"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    const tokenData = await tokenResponse.json();
    const userAccessToken = tokenData.access_token;

    if (!userAccessToken) {
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "no_access_token");
      errorUrl.searchParams.set(
        "message",
        "No access token received from Facebook"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Get user's pages
    const pagesUrl = `https://graph.facebook.com/v24.0/me/accounts?access_token=${userAccessToken}`;
    const pagesResponse = await fetch(pagesUrl);

    if (!pagesResponse.ok) {
      const errorData = await pagesResponse.json();
      console.error("Facebook pages fetch error:", errorData);
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "pages_fetch_failed");
      errorUrl.searchParams.set("message", "Failed to fetch Facebook pages");
      return NextResponse.redirect(errorUrl.toString());
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "no_pages");
      errorUrl.searchParams.set(
        "message",
        "No Facebook pages found. Please create a page first."
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Get website record first (before using it)
    const website = await prisma.website.findUnique({
      where: {
        licenseKey: licenseKey,
      },
    });

    if (!website || website.domain !== domain) {
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "website_not_found");
      errorUrl.searchParams.set("message", "Website not found");
      return NextResponse.redirect(errorUrl.toString());
    }

    // Use the first page (user can manage which page to use later if needed)
    const selectedPage = pages[0];
    const pageId = selectedPage.id;
    let pageAccessToken = selectedPage.access_token;
    const pageName = selectedPage.name;

    // Check if page is already connected to another website
    const existingPageConnection = await prisma.website.findFirst({
      where: {
        facebookPageId: pageId,
        id: { not: website.id },
      },
    });

    if (existingPageConnection) {
      const errorUrl = new URL(redirect_uri || "");
      errorUrl.searchParams.set("error", "page_already_connected");
      errorUrl.searchParams.set(
        "message",
        "This Facebook page is already connected to another website"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Exchange short-lived token for long-lived token (60 days)
    let tokenExpiresAt: Date;
    try {
      const longTokenUrl = new URL(
        "https://graph.facebook.com/v24.0/oauth/access_token"
      );
      longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
      longTokenUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
      longTokenUrl.searchParams.set("client_secret", FACEBOOK_APP_SECRET);
      longTokenUrl.searchParams.set("fb_exchange_token", pageAccessToken);

      const longTokenResponse = await fetch(longTokenUrl.toString(), {
        method: "GET",
      });

      if (longTokenResponse.ok) {
        const longTokenData = await longTokenResponse.json();
        if (longTokenData.access_token) {
          pageAccessToken = longTokenData.access_token;
          // Calculate expiration: long-lived tokens expire in ~60 days
          const expiresIn = longTokenData.expires_in || 5184000; // Default 60 days in seconds
          tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
        } else {
          // Fallback to short-lived token expiration
          tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
        }
      } else {
        console.warn(
          "Failed to exchange for long-lived token, using short-lived token"
        );
        // Short-lived tokens expire in ~1 hour
        tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
      }
    } catch (tokenExchangeError) {
      console.error(
        "Error exchanging for long-lived token:",
        tokenExchangeError
      );
      // Fallback to short-lived token expiration
      tokenExpiresAt = new Date(Date.now() + 3600 * 1000);
    }

    // Update website with token and expiration
    await prisma.website.update({
      where: { id: website.id },
      data: {
        facebookPageId: pageId,
        facebookPageAccessToken: pageAccessToken,
        messengerEnabled: true,
        tokenExpiresAt: tokenExpiresAt,
      },
    });

    // Subscribe page to webhook events
    try {
      const subscribeUrl = `https://graph.facebook.com/v24.0/${pageId}/subscribed_apps?access_token=${pageAccessToken}`;
      const subscribeResponse = await fetch(subscribeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscribed_fields:
            "messages,messaging_postbacks,messaging_handovers,messaging_optins",
        }),
      });

      if (!subscribeResponse.ok) {
        const errorData = await subscribeResponse.json();
        console.error("Facebook webhook subscription error:", errorData);
        // Continue even if subscription fails - admin can retry
      }
    } catch (subscribeError) {
      console.error("Error subscribing to webhooks:", subscribeError);
      // Continue - we'll store the credentials anyway
    }

    // Update KV cache with page_id -> domain mapping (for webhook lookups)
    await updatePageIdCache(pageId, website.domain);

    // Force refresh DO cache to include Messenger credentials from database
    // This ensures messenger_enabled, facebook_page_id, and facebook_page_access_token are synced
    await forceRefreshCloudflareCache(website.domain);

    // Also sync credits (in case they changed)
    await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsRemaining,
      plan: website.plan,
    });

    // Redirect back to WordPress with success
    const successUrl = new URL(redirect_uri || "");
    successUrl.searchParams.set("success", "true");
    successUrl.searchParams.set(
      "message",
      `Successfully connected to Facebook Page: ${pageName}`
    );
    successUrl.searchParams.set("page_id", pageId);
    successUrl.searchParams.set("page_name", pageName);

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    const decodedState = request.nextUrl.searchParams.get("state")
      ? JSON.parse(
          Buffer.from(
            request.nextUrl.searchParams.get("state")!,
            "base64"
          ).toString()
        )
      : null;
    const redirectUri = decodedState?.redirect_uri || "";
    const errorUrl = new URL(redirectUri || "");
    errorUrl.searchParams.set("error", "server_error");
    errorUrl.searchParams.set(
      "message",
      "An error occurred during authentication"
    );
    return NextResponse.redirect(errorUrl.toString());
  }
}
