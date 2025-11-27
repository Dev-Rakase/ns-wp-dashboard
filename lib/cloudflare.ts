/**
 * Cloudflare Worker API Client
 * Handles communication with the Cloudflare Worker for credit syncing
 */

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || "";
const CLOUDFLARE_ADMIN_TOKEN = process.env.CLOUDFLARE_ADMIN_TOKEN || "";

export interface SyncCreditsPayload {
  domain: string;
  credits_total: number;
  credits_remaining: number;
  plan: string;
}

export interface CloudflareResponse {
  success: boolean;
  message?: string;
  data?: {
    credits_total?: number;
    credits_remaining?: number;
    plan?: string;
    logs?: Array<{
      timestamp: number;
      operation: string;
      cost: number;
      credits_remaining: number;
    }>;
    total?: number;
    page?: number;
    per_page?: number;
  };
}

/**
 * Trigger Cloudflare Durable Object to sync credits
 */
export async function syncCreditsWithCloudflare(
  payload: SyncCreditsPayload
): Promise<CloudflareResponse> {
  if (!CLOUDFLARE_WORKER_URL || !CLOUDFLARE_ADMIN_TOKEN) {
    console.error("Cloudflare configuration missing");
    return {
      success: false,
      message: "Cloudflare configuration not set",
    };
  }

  try {
    const response = await fetch(`${CLOUDFLARE_WORKER_URL}/admin/set-credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": CLOUDFLARE_ADMIN_TOKEN,
      },
      body: JSON.stringify({
        site: payload.domain,
        credits_total: payload.credits_total,
        credits_remaining: payload.credits_remaining,
        plan: payload.plan,
        reason: "admin_panel_update",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to sync with Cloudflare",
      };
    }

    return {
      success: true,
      message: "Credits synced successfully",
      data,
    };
  } catch (error) {
    console.error("Error syncing with Cloudflare:", error);
    return {
      success: false,
      message: "Network error: Unable to reach Cloudflare Worker",
    };
  }
}

/**
 * Get usage logs from Cloudflare Durable Object
 */
export async function getUsageLogsFromCloudflare(
  domain: string,
  page: number = 1,
  perPage: number = 50
): Promise<CloudflareResponse> {
  if (!CLOUDFLARE_WORKER_URL || !CLOUDFLARE_ADMIN_TOKEN) {
    return {
      success: false,
      message: "Cloudflare configuration not set",
    };
  }

  try {
    const response = await fetch(
      `${CLOUDFLARE_WORKER_URL}/admin/usage-logs?site=${encodeURIComponent(
        domain
      )}&page=${page}&per_page=${perPage}`,
      {
        method: "GET",
        headers: {
          "X-Admin-Token": CLOUDFLARE_ADMIN_TOKEN,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch usage logs",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error fetching usage logs:", error);
    return {
      success: false,
      message: "Network error: Unable to reach Cloudflare Worker",
    };
  }
}
