import { NextResponse } from "next/server";

const getAuthToken = async () => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_AUTH_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        email: process.env.STACK_AI_EMAIL,
        password: process.env.STACK_AI_PASSWORD,
        gotrue_meta_security: {},
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Authentication failed: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.access_token;
};

// Get organization ID
const getOrgId = async (token: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organizations/me/current`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch organization ID: ${error}`);
  }

  const data = await response.json();
  return data.org_id;
};

// Trigger knowledge base sync
export async function POST(request: Request) {
  try {
    const token = await getAuthToken();
    const { kbId } = await request.json();

    if (!kbId) {
      throw new Error("Knowledge base ID is required");
    }

    const orgId = await getOrgId(token);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/knowledge_bases/sync/trigger/${kbId}/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to sync knowledge base: ${error}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
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
