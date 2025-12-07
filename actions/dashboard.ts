"use server";

import { prisma } from "@/lib/prisma";

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  try {
    // Total websites
    const totalWebsites = await prisma.website.count();

    // Active websites
    const activeWebsites = await prisma.website.count({
      where: { status: "ACTIVE" },
    });

    // Inactive websites
    const inactiveWebsites = await prisma.website.count({
      where: { status: "INACTIVE" },
    });

    // Suspended websites
    const suspendedWebsites = await prisma.website.count({
      where: { status: "SUSPENDED" },
    });

    // Total credits allocated
    const creditsData = await prisma.website.aggregate({
      _sum: {
        creditsTotal: true,
        creditsUsed: true,
        creditsRemaining: true,
      },
    });

    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    const now = new Date();

    const expiringWebsitesRaw = await prisma.website.findMany({
      where: {
        subscriptionEnd: {
          not: null,
          lte: tenDaysFromNow,
        },
      },
      orderBy: {
        subscriptionEnd: "asc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        domain: true,
        subscriptionEnd: true,
        plan: true,
        status: true,
      },
    });

    const expiringWebsites = expiringWebsitesRaw.map((site) => {
      const end = site.subscriptionEnd ? new Date(site.subscriptionEnd) : null;
      const days =
        end && end > now
          ? Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
      return {
        ...site,
        daysRemaining: days,
      };
    });

    return {
      success: true,
      data: {
        totalWebsites,
        activeWebsites,
        inactiveWebsites,
        suspendedWebsites,
        totalCreditsAllocated: creditsData._sum.creditsTotal || 0,
        totalCreditsUsed: creditsData._sum.creditsUsed || 0,
        totalCreditsRemaining: creditsData._sum.creditsRemaining || 0,
        expiringWebsites,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics" };
  }
}
