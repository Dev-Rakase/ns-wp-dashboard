import { getWebsite } from "@/actions/websites";
import { notFound } from "next/navigation";
import LogsClient from "./LogsClient";

export default async function WebsiteLogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const websiteId = parseInt(id);

  if (isNaN(websiteId)) {
    notFound();
  }

  const result = await getWebsite(websiteId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usage Logs</h1>
        <p className="text-gray-600 mt-1">
          View the latest 100 usage logs for content embedding and search
          queries from {result.data.domain}
        </p>
      </div>
      <LogsClient domain={result.data.domain} />
    </div>
  );
}
