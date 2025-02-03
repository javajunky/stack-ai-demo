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

const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3VhZGZxaGtseG9rbWxodHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NTg5ODAsImV4cCI6MTk4OTAzNDk4MH0.Xjry9m7oc42_MsLRc1bZhTTzip3srDjJ6fJMkwhXQ9s";

export default function Home() {
  const {
    data: connections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      // First authenticate
      const authResponse = await fetch(
        "https://sb.stack-ai.com/auth/v1/token?grant_type=password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Apikey: ANON_KEY,
          },
          body: JSON.stringify({
            email: "stackaitest@gmail.com",
            password: "!z4ZnxkyLYs#vR",
            gotrue_meta_security: {},
          }),
        }
      );

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        throw new Error(`Failed to authenticate: ${errorText}`);
      }

      const { access_token } = await authResponse.json();

      // Then fetch connections with the auth token
      const response = await fetch(
        "https://api.stack-ai.com/connections?connection_provider=gdrive&limit=1",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch connections: ${errorText}`);
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
          <ol className="list-decimal list-inside space-y-2">
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
            <li>
              Use these credentials:
              <ul className="ml-6 mt-2 space-y-1">
                <li>
                  <strong>Email:</strong> stackaitest@gmail.com
                </li>
                <li>
                  <strong>Password:</strong> !z4ZnxkyLYs#vR
                </li>
              </ul>
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
    <main className="container mx-auto p-4">
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
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
            {JSON.stringify(connections, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
