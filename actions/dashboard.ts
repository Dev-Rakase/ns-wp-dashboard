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

    // Websites by plan
    const websitesByPlan = await prisma.website.groupBy({
      by: ["plan"],
      _count: {
        id: true,
      },
    });

    // Recent activity (last 10 admin logs)
    const recentActivity = await prisma.adminLog.findMany({
      take: 10,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        website: {
          select: {
            domain: true,
            title: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Usage in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usageByDay = await prisma.$queryRaw<
      Array<{ date: string; total: number }>
    >`
      SELECT 
        DATE(timestamp) as date,
        COUNT(*) as total
      FROM usage_logs
      WHERE timestamp >= ${sevenDaysAgo}
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `;

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
        websitesByPlan: websitesByPlan.map((item) => ({
          plan: item.plan,
          count: item._count.id,
        })),
        recentActivity,
        usageByDay,
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics" };
  }
}
