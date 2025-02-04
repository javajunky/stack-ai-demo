"use client";

import { Resource } from "@/types/FilePicker";
import { cn } from "@/lib/utils";
import { File, Folder, Pen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

type ResourceStatus = "pending" | "indexed" | "failed" | "deleted" | "resource";

type ResourceItemProps = {
  resource: Resource & { status?: ResourceStatus };
  isSelected: boolean;
  onSelect: (resourceId: string) => void;
  onResourceClick: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onSync?: (resource: Resource) => void;
};

const statusColors: Record<ResourceStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  indexed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  deleted: "bg-red-100 text-red-800",
  resource: "",
};

export const ResourceItem = ({
  resource,
  isSelected,
  onSelect,
  onResourceClick,
  onDelete,
}: ResourceItemProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(resource);
  };

  const status = resource.status as ResourceStatus;

  return (
    <div className="flex items-center gap-2 px-4">
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
        onClick={() => onResourceClick(resource)}
        aria-label={`${
          resource.inode_type === "directory" ? "Folder" : "File"
        }: ${resource.inode_path.path}`}
      >
        {resource.inode_type === "directory" ? (
          <Folder className="w-4 h-4 text-amber-600" />
        ) : (
          <File className="w-4 h-4 text-blue-600" />
        )}
        <span className="truncate">{resource.inode_path.path}</span>
        {status && status !== "resource" && (
          <Badge
            variant="secondary"
            className={cn("ml-2", statusColors[status])}
          >
            {status}
          </Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(resource.modified_at).toLocaleDateString()}
        </span>
      </Button>
      <div className="flex gap-2 w-[72px] justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => e.stopPropagation()}
          aria-label="Update"
        >
          <Pen />
        </Button>
        {status !== "deleted" && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
};
