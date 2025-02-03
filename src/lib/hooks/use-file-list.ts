import { useQuery } from "@tanstack/react-query";
import { Resource } from "@/types/FilePicker";

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
  // First, get the knowledge base for this connection
  const { data: knowledgeBase } = useQuery({
    queryKey: ["knowledge-base", connectionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/knowledge-bases?connection_id=${connectionId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch knowledge base");
      }
      const data = await response.json();
      // The API returns an array of knowledge bases, we want the first one
      return Array.isArray(data) ? data[0] : data;
    },
  });

  // Then, fetch the knowledge base resources to get indexed status
  const { data: kbResources } = useQuery({
    queryKey: ["kb-resources", knowledgeBase?.knowledge_base_id],
    queryFn: async () => {
      if (!knowledgeBase?.knowledge_base_id) {
        return [];
      }
      const response = await fetch(
        `/api/knowledge-bases/${knowledgeBase.knowledge_base_id}/resources/children?resource_path=/`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to fetch knowledge base resources"
        );
      }
      const data = await response.json();
      return data;
    },
    enabled: !!knowledgeBase?.knowledge_base_id,
  });

  // Finally fetch the file list and merge with knowledge base status
  return useQuery({
    queryKey: ["files", connectionId, resourceId],
    queryFn: async () => {
      const token = await getAuthToken();
      const url = new URL(
        `${process.env.NEXT_PUBLIC_API_URL}/connections/${connectionId}/resources/children`
      );

      if (resourceId) {
        url.searchParams.append("resource_id", resourceId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch files: ${error}`);
      }

      const { data } = await response.json();

      if (!Array.isArray(data)) {
        return [];
      }

      // Merge knowledge base status with file list
      return data.map((resource: Resource) => {
        const kbResource = kbResources?.find(
          (kr: Resource) => kr.resource_id === resource.resource_id
        );
        return {
          ...resource,
          status: kbResource?.status || "resource",
          knowledge_base_id: knowledgeBase?.knowledge_base_id,
        };
      });
    },
    enabled: true,
  });
};

export default useFileList;
