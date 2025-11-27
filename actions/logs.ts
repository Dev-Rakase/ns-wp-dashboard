"use server";

import { prisma } from "@/lib/prisma";

/**
 * Get admin logs with filtering
 */
export async function getAdminLogs(params?: {
  websiteId?: number;
  action?: string;
  page?: number;
  perPage?: number;
}) {
  try {
    const page = params?.page || 1;
    const perPage = params?.perPage || 50;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (params?.websiteId) {
      where.websiteId = params.websiteId;
    }

    if (params?.action) {
      where.action = {
        contains: params.action,
      };
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        take: perPage,
        skip,
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
      }),
      prisma.adminLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return { success: false, error: "Failed to fetch admin logs" };
  }
}

/**
 * Get usage logs with filtering
 */
export async function getUsageLogs(params?: {
  websiteId?: number;
  operation?: string;
  page?: number;
  perPage?: number;
}) {
  try {
    const page = params?.page || 1;
    const perPage = params?.perPage || 50;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (params?.websiteId) {
      where.websiteId = params.websiteId;
    }

    if (params?.operation) {
      where.operation = params.operation;
    }

    const [logs, total] = await Promise.all([
      prisma.usageLog.findMany({
        where,
        take: perPage,
        skip,
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
        },
      }),
      prisma.usageLog.count({ where }),
    ]);

    return {
      success: true,
      data: {
        logs,
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  } catch (error) {
    console.error("Error fetching usage logs:", error);
    return { success: false, error: "Failed to fetch usage logs" };
  }
}
