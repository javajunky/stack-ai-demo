"use client";

import { useState } from "react";
import { FilePickerProps, Resource } from "@/types/file-picker";
import useFileList from "@/lib/hooks/use-file-list";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, File, Folder, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

export const FilePicker = ({
  connectionId,
  onFileSelect,
  onFolderSelect,
}: FilePickerProps) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(
    new Set()
  );
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [filterText, setFilterText] = useState("");

  const currentResourceId = currentPath[currentPath.length - 1];

  const {
    data: resources,
    isLoading,
    error,
  } = useFileList({
    connectionId,
    resourceId: currentResourceId,
  });

  const handleResourceClick = (resource: Resource) => {
    if (resource.inode_type === "directory") {
      setCurrentPath((prev) => [...prev, resource.resource_id]);
      onFolderSelect?.(resource);
    } else {
      onFileSelect?.(resource);
    }
  };

  const handleBackClick = () => {
    setCurrentPath((prev) => prev.slice(0, -1));
    setSelectedResources(new Set());
  };

  const handleResourceSelect = (resourceId: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }
      return next;
    });
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      indexed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      resource: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={cn("ml-2", variants[status] || "")}>{status}</Badge>
    );
  };

  const sortedAndFilteredResources = resources
    ?.filter((resource) =>
      resource.inode_path.path.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.inode_path.path.localeCompare(b.inode_path.path);
      }
      return (
        new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
      );
    });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-red-500">
            Error loading files. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">File Picker</CardTitle>
            <CardDescription>Select files or folders to index</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Filter by name..."
              value={filterText}
              onChange={handleFilterChange}
              className="w-48"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Sort By: {sortBy}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy("name")}>
                  {sortBy === "name" && <Check className="w-4 h-4 mr-2" />}
                  Name
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")}>
                  {sortBy === "date" && <Check className="w-4 h-4 mr-2" />}
                  Date Modified
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentPath.length > 0 && (
            <Button
              variant="ghost"
              onClick={handleBackClick}
              className="flex items-center gap-2"
              aria-label="Go back"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </Button>
          )}

          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {sortedAndFilteredResources?.map((resource) => (
                <div
                  key={resource.resource_id}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={selectedResources.has(resource.resource_id)}
                    onCheckedChange={() =>
                      handleResourceSelect(resource.resource_id)
                    }
                    aria-label={`Select ${resource.inode_path.path}`}
                  />
                  <Button
                    variant="ghost"
                    className={cn(
                      "flex-1 justify-start gap-3 px-2",
                      selectedResources.has(resource.resource_id) && "bg-accent"
                    )}
                    onClick={() => handleResourceClick(resource)}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
