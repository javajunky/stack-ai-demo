import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define a type for the knowledge base
export interface KnowledgeBase {
  knowledge_base_id?: string;
  id?: string;
  name?: string;
  description?: string;
  connection_id: string;
  connection_source_ids: string[];
  created_at: string;
}

interface KnowledgeBasePickerProps {
  connectionId: string;
  onSelect: (knowledgeBase: KnowledgeBase) => void;
}

const KnowledgeBasePicker = ({
  connectionId,
  onSelect,
}: KnowledgeBasePickerProps) => {
  const { data: knowledgeBases, isLoading } = useQuery({
    queryKey: ["knowledge-bases", connectionId],
    queryFn: async () => {
      const response = await fetch(
        `/api/knowledge-bases?connection_id=${connectionId}`
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch knowledge bases");
      }
      const data = await response.json();
      console.log("Raw API response:", data);

      // Check if data has an admin array
      if (data && data.admin && Array.isArray(data.admin)) {
        console.log("Found admin array:", data.admin);
        return data.admin;
      }

      // If data is already an array, use it
      if (Array.isArray(data)) {
        console.log("Data is an array:", data);
        return data;
      }

      // If data is a single object, wrap it in an array
      if (data && typeof data === "object") {
        console.log("Data is a single object:", data);
        return [data];
      }

      console.log("No valid data found, returning empty array");
      return [];
    },
  });

  if (isLoading) {
    return (
      <DropdownMenuItem disabled>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </DropdownMenuItem>
    );
  }

  if (!knowledgeBases?.length) {
    return (
      <DropdownMenuItem disabled>No knowledge bases found</DropdownMenuItem>
    );
  }

  return (
    <>
      {knowledgeBases.map((kb: KnowledgeBase) => {
        console.log("Rendering knowledge base:", kb);
        const id = kb.knowledge_base_id || kb.id;
        const displayName =
          kb.name ||
          (id ? `Knowledge Base ${id.slice(0, 8)}` : "Unnamed Knowledge Base");

        return (
          <DropdownMenuItem key={id} onSelect={() => onSelect(kb)}>
            {displayName}
          </DropdownMenuItem>
        );
      })}
    </>
  );
};

export default KnowledgeBasePicker;
