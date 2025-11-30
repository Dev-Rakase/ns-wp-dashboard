"use server";

import { prisma } from "@/lib/prisma";
import { syncCreditsWithCloudflare } from "@/lib/cloudflare";
import { generateLicenseKey } from "@/lib/license";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma, Plan, Status } from "@prisma/client";

/**
 * Get all websites with optional filtering
 */
export async function getWebsites(params?: {
  status?: string;
  plan?: string;
  search?: string;
}) {
  try {
    const where: Prisma.WebsiteWhereInput = {};

    if (params?.status) {
      where.status = params.status as Status;
    }

    if (params?.plan) {
      where.plan = params.plan as Plan;
    }

    if (params?.search) {
      where.OR = [
        { domain: { contains: params.search } },
        { title: { contains: params.search } },
      ];
    }

    const websites = await prisma.website.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: websites };
  } catch (error) {
    console.error("Error fetching websites:", error);
    return { success: false, error: "Failed to fetch websites" };
  }
}

/**
 * Get a single website by ID
 */
export async function getWebsite(id: number) {
  try {
    const website = await prisma.website.findUnique({
      where: { id },
      include: {
        usageLogs: {
          take: 50,
          orderBy: {
            timestamp: "desc",
          },
        },
        adminLogs: {
          take: 20,
          orderBy: {
            timestamp: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!website) {
      return { success: false, error: "Website not found" };
    }

    return { success: true, data: website };
  } catch (error) {
    console.error("Error fetching website:", error);
    return { success: false, error: "Failed to fetch website" };
  }
}

/**
 * Create a new website
 */
export async function createWebsite(data: {
  domain: string;
  title: string;
  plan: string;
  creditsTotal: number;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
}) {
  try {
    // Get current user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if domain already exists
    const existing = await prisma.website.findUnique({
      where: { domain: data.domain },
    });

    if (existing) {
      return { success: false, error: "Domain already exists" };
    }

    // Generate license key
    const licenseKey = generateLicenseKey();

    // Calculate next reset (first of next month)
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Create website
    const website = await prisma.website.create({
      data: {
        domain: data.domain,
        title: data.title,
        licenseKey,
        plan: data.plan as Plan,
        creditsTotal: data.creditsTotal,
        creditsRemaining: data.creditsTotal,
        creditsUsed: 0,
        status: Status.ACTIVE,
        subscriptionStart: data.subscriptionStart,
        subscriptionEnd: data.subscriptionEnd,
        nextReset,
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        websiteId: website.id,
        userId: session.user.id,
        action: "website_created",
        newValue: {
          domain: website.domain,
          title: website.title,
          plan: website.plan,
          creditsTotal: website.creditsTotal,
        },
        reason: "Initial setup",
      },
    });

    // Sync with Cloudflare
    await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsRemaining,
      plan: website.plan,
    });

    revalidatePath("/websites");
    return { success: true, data: website };
  } catch (error) {
    console.error("Error creating website:", error);
    return { success: false, error: "Failed to create website" };
  }
}

/**
 * Update a website
 */
export async function updateWebsite(
  id: number,
  data: {
    title?: string;
    plan?: string;
    status?: string;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Get old values for logging
    const oldWebsite = await prisma.website.findUnique({
      where: { id },
    });

    if (!oldWebsite) {
      return { success: false, error: "Website not found" };
    }

    // Update website
    const website = await prisma.website.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.plan && { plan: data.plan as Plan }),
        ...(data.status && { status: data.status as Status }),
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        websiteId: website.id,
        userId: session.user.id,
        action: "website_updated",
        oldValue: {
          title: oldWebsite.title,
          plan: oldWebsite.plan,
          status: oldWebsite.status,
        },
        newValue: {
          title: website.title,
          plan: website.plan,
          status: website.status,
        },
        reason: "Manual update",
      },
    });

    // Sync with Cloudflare if plan changed
    if (data.plan) {
      await syncCreditsWithCloudflare({
        domain: website.domain,
        credits_total: website.creditsTotal,
        credits_remaining: website.creditsRemaining,
        plan: website.plan,
      });
    }

    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    return { success: true, data: website };
  } catch (error) {
    console.error("Error updating website:", error);
    return { success: false, error: "Failed to update website" };
  }
}

/**
 * Delete a website
 */
export async function deleteWebsite(id: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return { success: false, error: "Website not found" };
    }

    // Delete website (cascade will handle logs)
    await prisma.website.delete({
      where: { id },
    });

    revalidatePath("/websites");
    return { success: true };
  } catch (error) {
    console.error("Error deleting website:", error);
    return { success: false, error: "Failed to delete website" };
  }
}

/**
 * Add or deduct credits
 */
export async function updateCredits(
  id: number,
  data: {
    amount: number;
    operation: "add" | "deduct";
    reason?: string;
  }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return { success: false, error: "Website not found" };
    }

    const oldCredits = website.creditsRemaining;
    let newCreditsRemaining: number;
    let newCreditsTotal: number = website.creditsTotal;

    if (data.operation === "add") {
      newCreditsRemaining = oldCredits + data.amount;
      newCreditsTotal = website.creditsTotal + data.amount;
    } else {
      newCreditsRemaining = Math.max(0, oldCredits - data.amount);
    }

    // Update website
    const updatedWebsite = await prisma.website.update({
      where: { id },
      data: {
        creditsRemaining: newCreditsRemaining,
        creditsTotal: newCreditsTotal,
        lastSync: new Date(),
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        websiteId: website.id,
        userId: session.user.id,
        action: `credits_${data.operation}`,
        oldValue: {
          creditsRemaining: oldCredits,
          creditsTotal: website.creditsTotal,
        },
        newValue: {
          creditsRemaining: newCreditsRemaining,
          creditsTotal: newCreditsTotal,
        },
        reason: data.reason || `Credits ${data.operation}ed by admin`,
      },
    });

    // Sync with Cloudflare
    const syncResult = await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: newCreditsTotal,
      credits_remaining: newCreditsRemaining,
      plan: website.plan,
    });

    if (!syncResult.success) {
      console.error("Failed to sync with Cloudflare:", syncResult.message);
    }

    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    return { success: true, data: updatedWebsite };
  } catch (error) {
    console.error("Error updating credits:", error);
    return { success: false, error: "Failed to update credits" };
  }
}

/**
 * Reset credits to plan default
 */
export async function resetCredits(id: number, reason?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return { success: false, error: "Website not found" };
    }

    const oldCredits = website.creditsRemaining;

    // Calculate next reset
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Reset credits
    const updatedWebsite = await prisma.website.update({
      where: { id },
      data: {
        creditsRemaining: website.creditsTotal,
        creditsUsed: 0,
        nextReset,
        lastSync: new Date(),
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        websiteId: website.id,
        userId: session.user.id,
        action: "credits_reset",
        oldValue: {
          creditsRemaining: oldCredits,
          creditsUsed: website.creditsUsed,
        },
        newValue: {
          creditsRemaining: website.creditsTotal,
          creditsUsed: 0,
        },
        reason: reason || "Manual credit reset",
      },
    });

    // Sync with Cloudflare
    await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsTotal,
      plan: website.plan,
    });

    revalidatePath("/websites");
    revalidatePath(`/websites/${id}`);
    return { success: true, data: updatedWebsite };
  } catch (error) {
    console.error("Error resetting credits:", error);
    return { success: false, error: "Failed to reset credits" };
  }
}

/**
 * Manual sync with Cloudflare
 */
export async function manualSync(id: number) {
  try {
    const website = await prisma.website.findUnique({
      where: { id },
    });

    if (!website) {
      return { success: false, error: "Website not found" };
    }

    // Sync with Cloudflare
    const syncResult = await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsRemaining,
      plan: website.plan,
    });

    if (!syncResult.success) {
      return { success: false, error: syncResult.message };
    }

    // Update last sync timestamp
    await prisma.website.update({
      where: { id },
      data: {
        lastSync: new Date(),
      },
    });

    revalidatePath(`/websites/${id}`);
    return { success: true, message: "Synced successfully" };
  } catch (error) {
    console.error("Error syncing:", error);
    return { success: false, error: "Failed to sync with Cloudflare" };
  }
}

/**
 * Renew subscription
 */
export async function renewSubscription(
  websiteId: number,
  data: {
    subscriptionStart: Date;
    subscriptionEnd: Date;
    creditsTotal: number;
    plan: Plan;
  }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const website = await prisma.website.update({
      where: { id: websiteId },
      data: {
        subscriptionStart: data.subscriptionStart,
        subscriptionEnd: data.subscriptionEnd,
        creditsTotal: data.creditsTotal,
        creditsRemaining: data.creditsTotal,
        creditsUsed: 0,
        plan: data.plan,
        status: Status.ACTIVE,
      },
    });

    // Sync with Cloudflare Durable Object
    await syncCreditsWithCloudflare({
      domain: website.domain,
      credits_total: website.creditsTotal,
      credits_remaining: website.creditsRemaining,
      plan: website.plan,
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        websiteId,
        userId: session.user.id,
        action: "renew_subscription",
        newValue: data,
        reason: "Manual subscription renewal",
      },
    });

    revalidatePath("/websites");
    revalidatePath(`/websites/${websiteId}`);
    return { success: true };
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return { success: false, error: "Failed to renew subscription" };
  }
}

/**
 * Regenerate license key
 */
export async function regenerateLicenseKey(websiteId: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    const oldWebsite = await prisma.website.findUnique({
      where: { id: websiteId },
      select: { licenseKey: true },
    });

    if (!oldWebsite) {
      return { success: false, error: "Website not found" };
    }

    const newKey = generateLicenseKey();

    const website = await prisma.website.update({
      where: { id: websiteId },
      data: { licenseKey: newKey },
    });

    // Log the regeneration
    await prisma.adminLog.create({
      data: {
        websiteId,
        userId: session.user.id,
        action: "regenerate_license_key",
        oldValue: { licenseKey: oldWebsite.licenseKey },
        newValue: { licenseKey: newKey },
        reason: "Manual license key regeneration",
      },
    });

    revalidatePath(`/websites/${websiteId}`);
    return { success: true, licenseKey: newKey };
  } catch (error) {
    console.error("Error regenerating license key:", error);
    return { success: false, error: "Failed to regenerate license key" };
  }
}
