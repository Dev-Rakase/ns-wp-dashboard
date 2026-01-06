/**
 * Cloudflare Worker API Client
 * Handles communication with the Cloudflare Worker for credit syncing
 */

const CLOUDFLARE_WORKER_URL = process.env.CLOUDFLARE_WORKER_URL || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

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
  if (!CLOUDFLARE_WORKER_URL || !ADMIN_TOKEN) {
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
        "X-Admin-Token": ADMIN_TOKEN,
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
  if (!CLOUDFLARE_WORKER_URL || !ADMIN_TOKEN) {
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
          "X-Admin-Token": ADMIN_TOKEN,
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

/**
 * Update KV cache with page_id -> domain mapping
 */
export async function updatePageIdCache(
  pageId: string,
  domain: string
): Promise<void> {
  // This will be implemented in Cloudflare Worker
  // For now, we'll call an admin endpoint if it exists
  if (!CLOUDFLARE_WORKER_URL || !ADMIN_TOKEN) {
    console.warn("Cloudflare configuration missing, skipping KV cache update");
    return;
  }

  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/admin/update-page-cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ pageId, domain }),
    });
  } catch (error) {
    console.error("Error updating page ID cache:", error);
    // Non-critical, continue
  }
}

/**
 * Invalidate page ID cache entry
 */
export async function invalidatePageIdCache(pageId: string): Promise<void> {
  if (!CLOUDFLARE_WORKER_URL || !ADMIN_TOKEN) {
    console.warn(
      "Cloudflare configuration missing, skipping KV cache invalidation"
    );
    return;
  }

  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/admin/invalidate-page-cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ pageId }),
    });
  } catch (error) {
    console.error("Error invalidating page ID cache:", error);
    // Non-critical, continue
  }
}

/**
 * Force refresh Cloudflare Durable Object cache
 */
export async function forceRefreshCloudflareCache(
  domain: string
): Promise<void> {
  if (!CLOUDFLARE_WORKER_URL || !ADMIN_TOKEN) {
    console.warn("Cloudflare configuration missing, skipping cache refresh");
    return;
  }

  try {
    await fetch(`${CLOUDFLARE_WORKER_URL}/admin/sync-credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ domain }),
    });
  } catch (error) {
    console.error("Error refreshing Cloudflare cache:", error);
    // Non-critical, continue
  }
}
