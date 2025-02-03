import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/utils/auth";
import { createApiResponse } from "@/lib/utils/api";

export async function DELETE(request: Request) {
  try {
    const token = await getAuthToken();
    const { searchParams } = new URL(request.url);
    const kbId = searchParams.get("kb_id");
    const resourcePath = searchParams.get("resource_path");

    if (!kbId || !resourcePath) {
      throw new Error("Knowledge base ID and resource path are required");
    }

    return NextResponse.json(
      await createApiResponse(
        fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL
          }/knowledge_bases/${kbId}/resources?resource_path=${encodeURIComponent(
            resourcePath
          )}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
