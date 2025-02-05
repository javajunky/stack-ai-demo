import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/utils/auth";

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
    throw new Error(`Failed to get organization info: ${error}`);
  }

  const data = await response.json();

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
      throw new Error(`Failed to sync: ${error}`);
    }

    const result = await response.json();
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
