import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/utils/auth";
import { createApiResponse } from "@/lib/utils/api";

// Get org ID from the token
async function getOrgId(token: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organizations/me/current`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to get organization info:", error);
    throw new Error(`Failed to get organization info: ${error}`);
  }

  const data = await response.json();
  console.log("Organizations response:", data);

  if (!data?.org_id) {
    throw new Error("No organization found");
  }

  return data.org_id;
}

// Trigger knowledge base sync
export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const { kbId } = await request.json();

    if (!kbId) {
      throw new Error("Knowledge base ID is required");
    }

    // Get the org ID
    const orgId = await getOrgId(token);

    console.log("Syncing knowledge base:", {
      kbId,
      orgId,
      url: `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`,
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Sync error response:", error);
      throw new Error(`Failed to sync: ${error}`);
    }

    const result = await response.json();
    console.log("Sync response:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing knowledge base:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
