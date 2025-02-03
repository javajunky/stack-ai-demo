"use client";

import { useQuery } from "@tanstack/react-query";
import { FilePicker } from "@/components/FilePicker";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Connection = {
  connection_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const {
    data: connections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const response = await fetch("/api/connections");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch connections");
      }

      return response.json() as Promise<Connection[]>;
    },
  });

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Loading connections...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
          <CardDescription>
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-2 list-decimal list-inside">
            <li>
              Log into Stack AI at{" "}
              <a
                href="https://stack.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                stack.ai
              </a>
            </li>
            <li>After logging in, return to this page and refresh</li>
          </ol>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <main className="container p-4 mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Google Drive File Picker</CardTitle>
          <CardDescription>Select files from your Google Drive</CardDescription>
        </CardHeader>
        <CardContent>
          {!connections || connections.length === 0 ? (
            <div className="text-center text-gray-500">
              No Google Drive connection found. Please create one in Stack AI.
            </div>
          ) : (
            <FilePicker connectionId={connections[0].connection_id} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
