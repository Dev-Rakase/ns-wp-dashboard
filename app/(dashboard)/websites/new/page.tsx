"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createWebsite } from "@/actions/websites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  { value: "FREE", label: "Free", credits: 100, description: "Perfect for testing" },
  { value: "BASIC", label: "Basic", credits: 1000, description: "For small websites" },
  { value: "PRO", label: "Pro", credits: 5000, description: "For growing sites" },
  { value: "ENTERPRISE", label: "Enterprise", credits: 20000, description: "For large operations" },
] as const;

const websiteSchema = z.object({
  domain: z
    .string()
    .min(3, "Domain must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$/,
      "Please enter a valid domain (e.g., example.com)"
    ),
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(100, "Title must be less than 100 characters"),
  plan: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]),
  creditsTotal: z
    .number()
    .int("Credits must be a whole number")
    .min(0, "Credits cannot be negative")
    .max(1000000, "Credits cannot exceed 1,000,000"),
});

type WebsiteFormValues = z.infer<typeof websiteSchema>;

export default function NewWebsitePage() {
  const router = useRouter();
  const [error, setError] = useState("");

  const form = useForm<WebsiteFormValues>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      domain: "",
      title: "",
      plan: "BASIC",
      creditsTotal: 1000,
    },
  });

  const selectedPlan = form.watch("plan");

  // Auto-update credits when plan changes
  const handlePlanChange = (value: string) => {
    const plan = PLANS.find((p) => p.value === value);
    if (plan) {
      form.setValue("creditsTotal", plan.credits);
    }
  };

  const onSubmit = async (data: WebsiteFormValues) => {
    setError("");

    try {
      const result = await createWebsite(data);

      if (result.success) {
        router.push("/websites");
        router.refresh();
      } else {
        setError(result.error || "Failed to create website");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
    <div className="p-8 max-w-5xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/websites">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Websites
        </Link>
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Website</h1>
          <p className="text-muted-foreground mt-2">
            Register a new WordPress installation to start using AI-powered semantic search
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Website Information</CardTitle>
            <CardDescription>
              Enter the details of the WordPress site you want to add
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the domain without http:// or https:// (e.g., example.com)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Awesome Website"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        A friendly name to identify this website
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
                        onValueChange={(value) => {
                          field.onChange(value);
                          handlePlanChange(value);
                        }}
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
                              <div className="flex flex-col">
                                <span className="font-medium">{plan.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {plan.credits.toLocaleString()} credits/month - {plan.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose a plan based on your expected usage
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="creditsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Credits</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Initial credit allocation for this website. Will be reset monthly based on plan.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/websites")}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Website"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
