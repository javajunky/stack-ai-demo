import { NextResponse } from "next/server";
import { getAuthToken } from "@/lib/utils/auth";
import { createApiResponse } from "@/lib/utils/api";

// Create a new knowledge base
export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const body = await request.json();

    // Ensure required fields are present
    if (!body.connection_id) {
      throw new Error("connection_id is required");
    }
    if (!body.connection_source_ids || !body.connection_source_ids.length) {
      throw new Error(
        "connection_source_ids is required and must not be empty"
      );
    }

    // Keep the original request body and only add missing fields
    const apiRequestBody = {
      ...body,
      indexing_params: body.indexing_params || {
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
      org_level_role: body.org_level_role ?? null,
      cron_job_id: body.cron_job_id ?? null,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
        body: JSON.stringify(apiRequestBody),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create knowledge base: ${error}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
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
    const connectionId = searchParams.get("connection_id");
    const kbId = searchParams.get("kb_id");
    const resourcePath = searchParams.get("path") || "/";

    // If connection_id is provided, fetch knowledge bases for that connection
    if (connectionId) {
      return NextResponse.json(
        await createApiResponse(
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases?connection_id=${connectionId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );
    }

    // If kb_id is provided, fetch resources for that knowledge base
    if (kbId) {
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
    }

    throw new Error("Either connection_id or kb_id is required");
  } catch (error) {
    console.error("Error fetching knowledge base data:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
