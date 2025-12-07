"use client";

import { useState, useEffect } from "react";
import { getWebsiteLogs } from "@/actions/websites";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Search } from "lucide-react";

interface LogEntry {
  id: number;
  timestamp: number;
  operation: string;
  cost: number;
  credits_remaining: number;
}

interface LogsData {
  logs: LogEntry[];
  total: number;
  page: number;
  per_page: number;
}

type TabType = "content" | "query";

export default function LogsClient({ domain }: { domain: string }) {
  const [logsData, setLogsData] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const perPage = 100; // Fetch 100 logs to match WordPress implementation

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);

      const result = await getWebsiteLogs(domain, 1, perPage);

      if (!result.success) {
        setError(result.error || "Failed to fetch logs");
        setLoading(false);
        return;
      }

      if (result.logs && result.total !== undefined) {
        setLogsData({
          logs: result.logs,
          total: result.total,
          page: result.page || 1,
          per_page: result.per_page || perPage,
        });
      }

      setLoading(false);
    };

    fetchLogs();
  }, [domain, perPage]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  // Filter logs by operation type
  const contentLogs =
    logsData?.logs.filter((log) => log.operation.toLowerCase() === "content") ||
    [];
  const queryLogs =
    logsData?.logs.filter((log) => log.operation.toLowerCase() === "query") ||
    [];
  const currentLogs = activeTab === "content" ? contentLogs : queryLogs;

  if (loading && !logsData) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("content")}
            className={`
              px-6 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === "content"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Content Embedding</span>
              <Badge variant="secondary" className="ml-1">
                {contentLogs.length}
              </Badge>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("query")}
            className={`
              px-6 py-3 text-sm font-medium transition-colors relative
              ${
                activeTab === "query"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Search Queries</span>
              <Badge variant="secondary" className="ml-1">
                {queryLogs.length}
              </Badge>
            </div>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center mt-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Unable to load logs
          </h3>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!error && currentLogs.length === 0 && (
        <div className="rounded-lg border p-12 text-center mt-4 bg-muted/20">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold mb-2">
            No {activeTab === "content" ? "Content Embedding" : "Search Query"}{" "}
            logs yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Logs will appear here once operations are performed.
          </p>
        </div>
      )}

      {/* Logs Table */}
      {!error && currentLogs.length > 0 && (
        <div className="rounded-b-lg border border-t-0 overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">
              Latest{" "}
              {activeTab === "content" ? "Content Embedding" : "Search Query"}{" "}
              Logs
            </h3>
            <span className="text-sm text-muted-foreground">
              Showing {currentLogs.length} most recent logs
            </span>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[200px] text-xs uppercase tracking-wider">
                  Timestamp
                </TableHead>
                <TableHead className="w-[140px] text-xs uppercase tracking-wider">
                  Operation
                </TableHead>
                <TableHead className="w-[120px] text-xs uppercase tracking-wider">
                  Cost
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider">
                  Credits Remaining
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.map((log) => {
                const { date, time } = formatTimestamp(log.timestamp);
                return (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{date}</span>
                        <span className="text-xs text-muted-foreground">
                          {time}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          log.operation.toLowerCase() === "content"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {log.operation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-destructive">
                        {log.cost.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold">
                        {log.credits_remaining.toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
