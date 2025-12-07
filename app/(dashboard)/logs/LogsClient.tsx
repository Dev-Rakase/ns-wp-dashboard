"use client";

import { useState, useEffect } from "react";
import { getAdminLogs } from "@/actions/logs";
import { getWebsites } from "@/actions/websites";
import { formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminLog {
  id: bigint;
  action: string;
  reason: string | null;
  timestamp: Date;
  oldValue: unknown;
  newValue: unknown;
  website: {
    title: string;
    domain: string;
  } | null;
  user: {
    name: string | null;
    email: string;
  };
}

interface Website {
  id: number;
  title: string;
  domain: string;
}

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "website_created", label: "Website Created" },
  { value: "website_updated", label: "Website Updated" },
  { value: "website_deleted", label: "Website Deleted" },
  { value: "credits_add", label: "Credits Added" },
  { value: "credits_deduct", label: "Credits Deducted" },
  { value: "credits_reset", label: "Credits Reset" },
  { value: "license_regenerated", label: "License Regenerated" },
  { value: "subscription_renewed", label: "Subscription Renewed" },
];

export default function LogsClient() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [websitesLoading, setWebsitesLoading] = useState(true);
  const [selectedWebsite, setSelectedWebsite] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 20;

  // Fetch websites for dropdown
  useEffect(() => {
    const fetchWebsites = async () => {
      setWebsitesLoading(true);
      const result = await getWebsites();
      if (result.success && result.data) {
        setWebsites(result.data);
      }
      setWebsitesLoading(false);
    };
    fetchWebsites();
  }, []);

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const result = await getAdminLogs({
        page,
        perPage,
        websiteId:
          selectedWebsite !== "all" ? parseInt(selectedWebsite) : undefined,
        action: selectedAction !== "all" ? selectedAction : undefined,
      });

      if (result.success && result.data) {
        setLogs(result.data.logs);
        setTotalPages(result.data.totalPages);
        setTotal(result.data.total);
      }
      setLoading(false);
    };

    fetchLogs();
  }, [page, selectedWebsite, selectedAction, perPage]);

  const formatCreditsChange = (log: AdminLog) => {
    if (log.action === "credits_add" || log.action === "credits_deduct") {
      const oldValue = log.oldValue as { creditsRemaining?: number } | null;
      const newValue = log.newValue as { creditsRemaining?: number } | null;

      if (
        oldValue?.creditsRemaining !== undefined &&
        newValue?.creditsRemaining !== undefined
      ) {
        const change = newValue.creditsRemaining - oldValue.creditsRemaining;
        return (
          <span className={change > 0 ? "text-green-600" : "text-red-600"}>
            {change > 0 ? "+" : ""}
            {change.toLocaleString()}
          </span>
        );
      }
    }
    return null;
  };

  const handleWebsiteChange = (value: string) => {
    setSelectedWebsite(value);
    setPage(1); // Reset to first page
  };

  const handleActionChange = (value: string) => {
    setSelectedAction(value);
    setPage(1); // Reset to first page
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Logs</h1>
        <p className="text-gray-600 mt-1">View all administrative actions</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Website Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <Select
              value={selectedWebsite}
              onValueChange={handleWebsiteChange}
              disabled={websitesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Websites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Websites</SelectItem>
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id.toString()}>
                    {website.title} ({website.domain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action Type
            </label>
            <Select value={selectedAction} onValueChange={handleActionChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Website
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Admin User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr
                      key={log.id.toString()}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {log.reason || "-"}
                          {formatCreditsChange(log) && (
                            <div className="mt-1 font-semibold">
                              Credits: {formatCreditsChange(log)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.website?.title || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.website?.domain || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {log.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.user?.email || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(page - 1) * perPage + 1} to{" "}
                  {Math.min(page * perPage, total)} of {total} logs
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
