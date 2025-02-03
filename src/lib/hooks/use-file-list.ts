import { useQuery } from "@tanstack/react-query";
import { Resource } from "@/types/file-picker";

const API_URL = "https://api.stack-ai.com";

type UseFileListProps = {
  connectionId: string;
  resourceId?: string;
};

const useFileList = ({ connectionId, resourceId }: UseFileListProps) => {
  return useQuery({
    queryKey: ["files", connectionId, resourceId],
    queryFn: async () => {
      const url = new URL(
        `${API_URL}/connections/${connectionId}/resources/children`
      );

      if (resourceId) {
        url.searchParams.append("resource_id", resourceId);
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // This is important for the auth cookie
      });

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      return response.json() as Promise<Resource[]>;
    },
  });
};

export default useFileList;
