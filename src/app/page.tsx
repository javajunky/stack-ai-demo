"use client";

import { useQuery } from "@tanstack/react-query";
import { FilePicker } from "@/components/file-picker";
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

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Available Connections</CardTitle>
          <CardDescription>All connections in your account</CardDescription>
        </CardHeader>
        <CardContent>
          {!connections || connections.length === 0 ? (
            <div className="text-center text-gray-500">
              No connections found
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((conn) => (
                <div key={conn.connection_id} className="p-4 border rounded-lg">
                  <p>
                    <strong>Connection ID:</strong> {conn.connection_id}
                  </p>
                  <p>
                    <strong>Name:</strong> {conn.name}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(conn.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Raw Debug Information</CardTitle>
          <CardDescription>Full connection data</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 overflow-auto text-sm bg-gray-100 rounded-lg max-h-96">
            {JSON.stringify(connections, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
