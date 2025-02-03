import { useQuery } from "@tanstack/react-query";
import { Resource } from "@/types/file-picker";

const API_URL = "https://api.stack-ai.com";
const SUPABASE_AUTH_URL = "https://sb.stack-ai.com";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZic3VhZGZxaGtseG9rbWxodHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzM0NTg5ODAsImV4cCI6MTk4OTAzNDk4MH0.Xjry9m7oc42_MsLRc1bZhTTzip3srDjJ6fJMkwhXQ9s";
const EMAIL = "stackaitest@gmail.com";
const PASSWORD = "!z4ZnxkyLYs#vR";

const getAuthToken = async () => {
  const response = await fetch(
    `${SUPABASE_AUTH_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Apikey: ANON_KEY,
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
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

type UseFileListProps = {
  connectionId: string;
  resourceId?: string;
};

const useFileList = ({ connectionId, resourceId }: UseFileListProps) => {
  return useQuery({
    queryKey: ["files", connectionId, resourceId],
    queryFn: async () => {
      const token = await getAuthToken();
      const url = new URL(
        `${API_URL}/connections/${connectionId}/resources/children`
      );

      if (resourceId) {
        url.searchParams.append("resource_id", resourceId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch files: ${error}`);
      }

      const { data } = await response.json();
      console.log("API Response data:", data); // Debug log

      if (!Array.isArray(data)) {
        console.error(
          "Expected array in data property, got:",
          typeof data,
          data
        );
        return []; // Return empty array if data is not an array
      }

      return data as Resource[];
    },
  });
};

export default useFileList;
