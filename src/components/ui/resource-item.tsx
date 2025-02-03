"use client";

import { Resource } from "@/types/FilePicker";
import { cn } from "@/lib/utils";
import { File, Folder, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ResourceItemProps = {
  resource: Resource;
  isSelected: boolean;
  onSelect: (resourceId: string) => void;
  onClick: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
};

const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    indexed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    resource: "bg-blue-100 text-blue-800",
  };

  return <Badge className={cn("ml-2", variants[status] || "")}>{status}</Badge>;
};

export const ResourceItem = ({
  resource,
  isSelected,
  onSelect,
  onClick,
  onDelete,
}: ResourceItemProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(resource);
  };

  return (
    <div className="flex items-center gap-2 group">
      <Checkbox
        checked={isSelected}
        onCheckedChange={() => onSelect(resource.resource_id)}
        aria-label={`Select ${resource.inode_path.path}`}
      />
      <Button
        variant="ghost"
        className={cn(
          "flex-1 justify-start gap-3 px-2",
          isSelected && "bg-accent"
        )}
        onClick={() => onClick(resource)}
        aria-label={`${
          resource.inode_type === "directory" ? "Folder" : "File"
        }: ${resource.inode_path.path}`}
      >
        {resource.inode_type === "directory" ? (
          <Folder className="w-4 h-4" />
        ) : (
          <File className="w-4 h-4" />
        )}
        <span className="truncate">{resource.inode_path.path}</span>
        {getStatusBadge(resource.status)}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(resource.modified_at).toLocaleDateString()}
        </span>
      </Button>
      {resource.status === "indexed" && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              aria-label="Remove from index"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove from index</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
