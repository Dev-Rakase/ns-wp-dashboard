import { getWebsite } from "@/actions/websites";
import { notFound } from "next/navigation";
import WebsiteDetailsClient from "./WebsiteDetailsClient";

export default async function WebsiteDetailsPage({
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

  return <WebsiteDetailsClient website={result.data} />;
}

