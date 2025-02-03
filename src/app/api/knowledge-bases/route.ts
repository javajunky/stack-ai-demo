import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/utils/auth";
import { createApiResponse } from "@/lib/utils/api";

// Create a new knowledge base
export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const body = await request.json();

    return NextResponse.json(
      await createApiResponse(
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            connection_id: body.connectionId,
            connection_source_ids: body.resourceIds,
            name: body.name || "New Knowledge Base",
            description: body.description || "Created from File Picker",
            indexing_params: {
              ocr: false,
              unstructured: true,
              embedding_params: {
                embedding_model: "text-embedding-ada-002",
                api_key: null,
              },
              chunker_params: {
                chunk_size: 1500,
                chunk_overlap: 500,
                chunker: "sentence",
              },
            },
          }),
        })
      )
    );
  } catch (error) {
    console.error("Error creating knowledge base:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Get knowledge base resources
export async function GET(request: Request) {
  try {
    const token = await getAuthToken();
    const { searchParams } = new URL(request.url);
    const kbId = searchParams.get("id");
    const resourcePath = searchParams.get("path") || "/";

    if (!kbId) {
      throw new Error("Knowledge base ID is required");
    }

    return NextResponse.json(
      await createApiResponse(
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases/${kbId}/resources/children?resource_path=${resourcePath}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      )
    );
  } catch (error) {
    console.error("Error fetching knowledge base resources:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
