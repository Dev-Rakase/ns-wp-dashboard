import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
const ADMIN_PANEL_URL =
  process.env.ADMIN_PANEL_URL || process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || "";
const FACEBOOK_REDIRECT_URI = `${ADMIN_PANEL_URL}/api/messenger/callback`;

/**
 * Initiate Facebook OAuth flow
 * Public endpoint - accepts domain and license key from WordPress
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get("domain");
    const licenseKey = searchParams.get("license_key");

    if (!domain || !licenseKey) {
      const errorUrl = new URL(searchParams.get("redirect_uri") || "");
      errorUrl.searchParams.set("error", "missing_params");
      errorUrl.searchParams.set(
        "message",
        "Domain and license key are required"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Validate license key and check if website exists
    const website = await prisma.website.findUnique({
      where: {
        licenseKey: licenseKey,
      },
    });

    if (!website || website.domain !== domain) {
      const errorUrl = new URL(searchParams.get("redirect_uri") || "");
      errorUrl.searchParams.set("error", "invalid_license");
      errorUrl.searchParams.set(
        "message",
        "Invalid license key or domain mismatch"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Check if plan is paid (BASIC, PRO, or ENTERPRISE)
    const paidPlans = ["BASIC", "PRO", "ENTERPRISE"];
    if (!paidPlans.includes(website.plan)) {
      const errorUrl = new URL(searchParams.get("redirect_uri") || "");
      errorUrl.searchParams.set("error", "plan_not_supported");
      errorUrl.searchParams.set(
        "message",
        "Messenger is only available for paid plans (BASIC, PRO, ENTERPRISE)"
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    // Check if account is active
    if (website.status !== "ACTIVE") {
      const errorUrl = new URL(searchParams.get("redirect_uri") || "");
      errorUrl.searchParams.set("error", "account_inactive");
      errorUrl.searchParams.set(
        "message",
        `Account is ${website.status.toLowerCase()}`
      );
      return NextResponse.redirect(errorUrl.toString());
    }

    if (!FACEBOOK_APP_ID) {
      const errorUrl = new URL(searchParams.get("redirect_uri") || "");
      errorUrl.searchParams.set("error", "config_error");
      errorUrl.searchParams.set("message", "Facebook app not configured");
      return NextResponse.redirect(errorUrl.toString());
    }

    // Get WordPress redirect URI from query params (where to redirect after OAuth)
    const wpRedirectUri =
      searchParams.get("redirect_uri") ||
      `https://${domain}/wp-admin/admin.php?page=ns-ai-search-messenger`;

    // Build Facebook OAuth URL
    // Include redirect_uri in state so we can redirect back to WordPress after OAuth
    // Facebook will preserve the state parameter through the OAuth flow
    const state = Buffer.from(
      JSON.stringify({
        domain,
        licenseKey,
        redirect_uri: wpRedirectUri,
      })
    ).toString("base64");

    const facebookAuthUrl = new URL(
      "https://www.facebook.com/v24.0/dialog/oauth"
    );
    facebookAuthUrl.searchParams.set("client_id", FACEBOOK_APP_ID);
    // redirect_uri must match exactly what's configured in Facebook App settings
    facebookAuthUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
    facebookAuthUrl.searchParams.set(
      "scope",
      "pages_messaging,pages_manage_metadata,business_management,pages_show_list"
    );
    facebookAuthUrl.searchParams.set("state", state);
    facebookAuthUrl.searchParams.set("response_type", "code");

    return NextResponse.redirect(facebookAuthUrl.toString());
  } catch (error) {
    console.error("Facebook OAuth initiation error:", error);
    const errorUrl = new URL(
      request.nextUrl.searchParams.get("redirect_uri") || ""
    );
    errorUrl.searchParams.set("error", "server_error");
    errorUrl.searchParams.set(
      "message",
      "An error occurred during authentication"
    );
    return NextResponse.redirect(errorUrl.toString());
  }
}
