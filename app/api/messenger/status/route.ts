import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get Messenger token expiration status for a website
 * Called by WordPress plugin to check token expiration
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const licenseKey = searchParams.get("license_key");
    const domain = searchParams.get("domain");

    if (!licenseKey || !domain) {
      return NextResponse.json(
        { success: false, error: "Missing license_key or domain" },
        { status: 400 }
      );
    }

    // Find website by license key and domain
    const website = await prisma.website.findFirst({
      where: {
        licenseKey: licenseKey,
        domain: domain,
      },
      select: {
        messengerEnabled: true,
        tokenExpiresAt: true,
        facebookPageId: true,
      },
    });

    if (!website) {
      return NextResponse.json(
        { success: false, error: "Website not found" },
        { status: 404 }
      );
    }

    if (!website.messengerEnabled || !website.tokenExpiresAt) {
      return NextResponse.json({
        success: true,
        messengerEnabled: false,
        tokenExpiresAt: null,
      });
    }

    // Return token expiration as ISO string
    return NextResponse.json({
      success: true,
      messengerEnabled: true,
      tokenExpiresAt: website.tokenExpiresAt.toISOString(),
      facebookPageId: website.facebookPageId,
    });
  } catch (error) {
    console.error("Error fetching messenger status:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
