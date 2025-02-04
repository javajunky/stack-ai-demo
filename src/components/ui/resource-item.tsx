"use client";

import { Resource } from "@/types/FilePicker";
import { cn } from "@/lib/utils";
import { File, Folder, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ResourceStatus = "pending" | "indexed" | "failed" | "deleted" | "resource";

type ResourceItemProps = {
  resource: Resource & { status?: ResourceStatus };
  isSelected: boolean;
  onSelect: (resourceId: string) => void;
  onClick: (resource: Resource) => void;
  onDelete?: (resource: Resource) => void;
  onSync?: (resource: Resource) => void;
};

const getStatusBadge = (status?: ResourceStatus) => {
  if (!status) return null;

  const displayStatus = status === "resource" ? "indexed" : status;

  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    indexed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    deleted: "bg-red-100 text-red-800",
  };

  return (
    <Badge className={cn("ml-2", variants[displayStatus] || "")}>
      {displayStatus}
    </Badge>
  );
};

export const ResourceItem = ({
  resource,
  isSelected,
  onSelect,
  onClick,
  onDelete,
  onSync,
}: ResourceItemProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(resource);
  };

  const handleSync = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSync?.(resource);
  };

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
        onClick={() => onClick(resource)}
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
        {getStatusBadge(resource.status)}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(resource.modified_at).toLocaleDateString()}
        </span>
      </Button>
      <div className="flex gap-2 w-[72px] justify-end">
        {(resource.status as string) !== "deleted" && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                aria-label="Remove from index"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove from index</TooltipContent>
          </Tooltip>
        )}
        {(resource.status === "indexed" || resource.status === "resource") &&
          onSync && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSync}
                  aria-label="Sync resource"
                >
                  <RefreshCw className="w-4 h-4 text-blue-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sync resource</TooltipContent>
            </Tooltip>
          )}
      </div>
    </div>
  );
};
