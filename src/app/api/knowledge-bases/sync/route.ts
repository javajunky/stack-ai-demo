import { NextResponse } from "next/server";
import { getAuthToken, getOrgId } from "@/lib/utils/auth";
import { createApiResponse } from "@/lib/utils/api";

// Trigger knowledge base sync
export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const { kbId } = await request.json();

    if (!kbId) {
      throw new Error("Knowledge base ID is required");
    }

    const orgId = await getOrgId(token);

    return NextResponse.json(
      await createApiResponse(
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );
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
