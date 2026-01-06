"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { updateWebsite, getWebsite } from "@/actions/websites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLANS = [
  { value: "FREE", label: "Free", credits: 100 },
  { value: "BASIC", label: "Basic", credits: 1000 },
  { value: "PRO", label: "Pro", credits: 5000 },
  { value: "ENTERPRISE", label: "Enterprise", credits: 20000 },
] as const;

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;

const websiteSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  plan: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

type WebsiteFormValues = z.infer<typeof websiteSchema>;

export default function EditWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [websiteId, setWebsiteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      title: "",
      plan: "BASIC",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    async function loadWebsite() {
      try {
        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);
        setWebsiteId(id);

        if (isNaN(id)) {
          setError("Invalid website ID");
          setLoading(false);
          return;
        }

        const result = await getWebsite(id);
        if (result.success && result.data) {
          form.reset({
            title: result.data.title,
            plan: result.data.plan,
            status: result.data.status,
          });
        } else {
          setError(result.error || "Failed to load website");
        }
      } catch (err) {
        setError("An error occurred while loading the website");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadWebsite();
  }, [params, form]);

  const onSubmit = async (data: WebsiteFormValues) => {
    if (!websiteId) return;

    setError("");
    setSubmitting(true);

    try {
      const result = await updateWebsite(websiteId, {
        title: data.title,
        plan: data.plan,
        status: data.status,
      });

      if (result.success) {
        router.push(`/websites/${websiteId}`);
        router.refresh();
      } else {
        setError(result.error || "Failed to update website");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error && !websiteId) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href="/websites" className="text-blue-600 hover:underline">
            ← Back to Websites
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <Link
          href={`/websites/${websiteId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Website Details
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Website</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Website Information</CardTitle>
          <CardDescription>
            Update website details. Changes to plan will trigger a cache
            refresh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Website Title" />
                    </FormControl>
                    <FormDescription>
                      A friendly name for this website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PLANS.map((plan) => (
                          <SelectItem key={plan.value} value={plan.value}>
                            {plan.label} ({plan.credits.toLocaleString()}{" "}
                            credits)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Changing the plan will refresh the Cloudflare cache
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Website account status</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
