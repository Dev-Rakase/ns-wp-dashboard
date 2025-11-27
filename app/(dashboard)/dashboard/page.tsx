import { getDashboardStats } from "@/actions/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Globe,
  CreditCard,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const result = await getDashboardStats();

  if (!result.success || !result.data) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const stats = result.data;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your AI search infrastructure
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Websites</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWebsites}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeWebsites} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeWebsites}</div>
            <p className="text-xs text-muted-foreground">
              {stats.suspendedWebsites} suspended
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Allocated</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCreditsAllocated.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCreditsRemaining.toLocaleString()} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalCreditsUsed.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalCreditsAllocated > 0
                ? `${Math.round((stats.totalCreditsUsed / stats.totalCreditsAllocated) * 100)}% usage`
                : "0% usage"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Websites by Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Websites by Plan</CardTitle>
            <CardDescription>Distribution of websites across plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.websitesByPlan.map((item) => (
              <div key={item.plan} className="flex items-center justify-between">
                <Badge
                  variant={
                    item.plan === "FREE"
                      ? "secondary"
                      : item.plan === "BASIC"
                      ? "default"
                      : item.plan === "PRO"
                      ? "default"
                      : "default"
                  }
                >
                  {item.plan}
                </Badge>
                <span className="text-2xl font-bold">{item.count}</span>
              </div>
            ))}
            {stats.websitesByPlan.length === 0 && (
              <p className="text-sm text-muted-foreground">No websites yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest admin actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {stats.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                stats.recentActivity.map((log) => (
                  <div
                    key={log.id.toString()}
                    className="flex flex-col space-y-1 py-2 border-b last:border-0"
                  >
                    <p className="text-sm font-medium">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.website?.domain || "N/A"} by {log.user?.name || log.user?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Chart */}
      {stats.usageByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Last 7 Days</CardTitle>
            <CardDescription>Daily operation count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.usageByDay.map((day: { date: string; total: number }) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium">{Number(day.total)} operations</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
