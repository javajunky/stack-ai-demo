import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBase, Resource } from "@/types/FilePicker";

export const useKnowledgeBase = (connectionId: string) => {
  const queryClient = useQueryClient();

  // Create a new knowledge base
  const createKnowledgeBase = useMutation({
    mutationFn: async ({
      resourceIds,
      name,
      description,
    }: {
      resourceIds: string[];
      name?: string;
      description?: string;
    }) => {
      const response = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId,
          resourceIds,
          name,
          description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create knowledge base");
      }

      return response.json() as Promise<KnowledgeBase>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  // Sync a knowledge base
  const syncKnowledgeBase = useMutation({
    mutationFn: async (kbId: string) => {
      const response = await fetch("/api/knowledge-bases/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ kbId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync knowledge base");
      }

      return response.json();
    },
  });

  // Get knowledge base resources
  const getKnowledgeBaseResources = useQuery({
    queryKey: ["kb-resources", connectionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/knowledge-bases?id=${connectionId}&path=/`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to fetch knowledge base resources"
        );
      }

      return response.json() as Promise<Resource[]>;
    },
  });

  return {
    createKnowledgeBase,
    syncKnowledgeBase,
    getKnowledgeBaseResources,
  };
};
