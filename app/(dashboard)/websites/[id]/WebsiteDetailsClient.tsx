"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
  Eye,
  EyeOff,
  Copy,
  Key,
} from "lucide-react";
import {
  formatDate,
  formatCredits,
  getPlanColor,
  getStatusColor,
} from "@/lib/utils";
import {
  updateCredits,
  resetCredits,
  manualSync,
  regenerateLicenseKey,
} from "@/actions/websites";
import { useRouter } from "next/navigation";
import { Prisma } from "@prisma/client";

type Website = Prisma.WebsiteGetPayload<{
  include: {
    adminLogs: {
      include: {
        user: {
          select: {
            name: true;
            email: true;
          };
        };
      };
    };
  };
}>;

export default function WebsiteDetailsClient({
  website,
}: {
  website: Website;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsOperation, setCreditsOperation] = useState<"add" | "deduct">(
    "add"
  );
  const [creditsReason, setCreditsReason] = useState("");

  // License key states
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    setMessage(null);
    const result = await manualSync(website.id);
    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: "Synced successfully with Cloudflare",
      });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error || "Sync failed" });
    }
  };

  const handleCreditsUpdate = async () => {
    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    setLoading(true);
    const result = await updateCredits(website.id, {
      amount,
      operation: creditsOperation,
      reason: creditsReason || undefined,
    });
    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: `Credits ${
          creditsOperation === "add" ? "added" : "deducted"
        } successfully`,
      });
      setShowCreditsModal(false);
      setCreditsAmount("");
      setCreditsReason("");
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to update credits",
      });
    }
  };

  const handleResetCredits = async () => {
    if (!confirm("Are you sure you want to reset credits to plan default?"))
      return;

    setLoading(true);
    const result = await resetCredits(website.id, "Manual reset by admin");
    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Credits reset successfully" });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to reset credits",
      });
    }
  };

  const handleCopyLicenseKey = async () => {
    try {
      await navigator.clipboard.writeText(website.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage({ type: "error", text: "Failed to copy license key" });
    }
  };

  const handleRegenerateLicenseKey = async () => {
    setLoading(true);
    setShowRegenerateModal(false);
    const result = await regenerateLicenseKey(website.id);
    setLoading(false);

    if (result.success) {
      setMessage({
        type: "success",
        text: `License key regenerated successfully! New key: ${result.licenseKey}`,
      });
      router.refresh();
    } else {
      setMessage({
        type: "error",
        text: result.error || "Failed to regenerate license key",
      });
    }
  };

  const creditsPercentage =
    (website.creditsRemaining / website.creditsTotal) * 100;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/websites"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Websites
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {website.title}
            </h1>
            <p className="text-gray-600 mt-1">{website.domain}</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSync}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sync Now
            </button>
            <Link
              href={`/websites/${website.id}/logs`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View Logs
            </Link>
            <Link
              href={`/websites/${website.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Edit
            </Link>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-6 rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Plan</h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(
              website.plan
            )}`}
          >
            {website.plan}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              website.status
            )}`}
          >
            {website.status}
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Last Sync</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(website.lastSync)}
          </p>
        </div>
      </div>

      {/* License Key Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Key className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">License Key</h2>
          </div>
          <button
            onClick={() => setShowRegenerateModal(true)}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Regenerate
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-gray-50 rounded-md p-3 border border-gray-200">
              <code className="text-sm font-mono text-gray-900">
                {showLicenseKey
                  ? website.licenseKey
                  : `${"•".repeat(
                      website.licenseKey.length - 8
                    )}${website.licenseKey.slice(-8)}`}
              </code>
            </div>
            <button
              onClick={() => setShowLicenseKey(!showLicenseKey)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              title={showLicenseKey ? "Hide" : "Show"}
            >
              {showLicenseKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleCopyLicenseKey}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4 mr-1" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            This license key is required for the WordPress plugin to
            authenticate with the AI Search service. Keep it secure and never
            share it publicly.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <p className="text-xs text-amber-800">
              <strong>Warning:</strong> Regenerating the license key will
              immediately invalidate the old key. You will need to update the
              WordPress plugin settings with the new key.
            </p>
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Credits Management
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setCreditsOperation("add");
                setShowCreditsModal(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </button>
            <button
              onClick={() => {
                setCreditsOperation("deduct");
                setShowCreditsModal(true);
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Minus className="h-3 w-3 mr-1" />
              Deduct
            </button>
            <button
              onClick={handleResetCredits}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCredits(website.creditsTotal)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Remaining</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCredits(website.creditsRemaining)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Used</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCredits(website.creditsUsed)}
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              creditsPercentage < 20
                ? "bg-red-600"
                : creditsPercentage < 50
                ? "bg-yellow-600"
                : "bg-green-600"
            }`}
            style={{ width: `${creditsPercentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {creditsPercentage.toFixed(1)}% remaining • Next reset:{" "}
          {formatDate(website.nextReset)}
        </p>
      </div>

      {/* Usage Logs helper */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Usage Logs</h2>
        <p className="text-sm text-gray-600">
          Usage activity is logged directly inside the Durable Object backing
          this site. Use the{" "}
          <Link
            href={`/websites/${website.id}/logs`}
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            dedicated logs page
          </Link>{" "}
          to inspect paginated records pulled from that store.
        </p>
      </div>

      {/* Admin Logs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Admin Activity
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Latest 10 administrative actions
          </p>
        </div>
        {website.adminLogs.length === 0 ? (
          <div className="p-6">
            <p className="text-gray-500 text-sm text-center">
              No admin activity yet
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Admin User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {website.adminLogs.map((log) => {
                  // Calculate credits change for add/deduct operations
                  let creditsChange = null;
                  if (
                    log.action === "credits_add" ||
                    log.action === "credits_deduct"
                  ) {
                    const oldValue = log.oldValue as {
                      creditsRemaining?: number;
                    } | null;
                    const newValue = log.newValue as {
                      creditsRemaining?: number;
                    } | null;
                    if (
                      oldValue?.creditsRemaining !== undefined &&
                      newValue?.creditsRemaining !== undefined
                    ) {
                      const change =
                        newValue.creditsRemaining - oldValue.creditsRemaining;
                      creditsChange = (
                        <span
                          className={`font-semibold ${
                            change > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {change > 0 ? "+" : ""}
                          {change.toLocaleString()}
                        </span>
                      );
                    }
                  }

                  return (
                    <tr
                      key={log.id.toString()}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-sm text-gray-900">
                          {log.reason || "-"}
                        </div>
                        {creditsChange && (
                          <div className="text-sm mt-1">
                            Credits: {creditsChange}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.user.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Credits Modal */}
      {showCreditsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              {creditsOperation === "add" ? "Add" : "Deduct"} Credits
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={creditsReason}
                  onChange={(e) => setCreditsReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Enter reason..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreditsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditsUpdate}
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
                  creditsOperation === "add"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {loading
                  ? "Processing..."
                  : creditsOperation === "add"
                  ? "Add Credits"
                  : "Deduct Credits"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate License Key Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-red-700">
              Regenerate License Key?
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Are you sure you want to regenerate the license key for{" "}
                <strong>{website.domain}</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">
                  ⚠️ This action will:
                </h4>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>Immediately invalidate the current license key</li>
                  <li>Break the connection with the WordPress site</li>
                  <li>Require manual update in WordPress plugin settings</li>
                  <li>Stop all AI search functionality until updated</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                You will need to copy the new license key and update it in the
                WordPress plugin settings to restore functionality.
              </p>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateLicenseKey}
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Regenerating..." : "Yes, Regenerate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
