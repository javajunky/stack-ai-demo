"use client";

import { useState } from "react";
import { FilePickerProps, Resource } from "@/types/FilePicker";
import useFileList from "@/lib/hooks/use-file-list";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, Check } from "lucide-react";
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
import { ResourceItem } from "@/components/ui/resource-item";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

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
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentResourceId = currentPath[currentPath.length - 1];

  const {
    data: resources,
    isLoading,
    error,
  } = useFileList({
    connectionId,
    resourceId: currentResourceId,
  });

  const deleteResource = useMutation({
    mutationFn: async (resource: Resource) => {
      if (!resource.knowledge_base_id) {
        throw new Error("No knowledge base ID found for resource");
      }

      const response = await fetch(
        `/api/knowledge-bases/resources?kb_id=${
          resource.knowledge_base_id
        }&resource_path=${encodeURIComponent(resource.inode_path.path)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete resource");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: "Resource de-indexed",
        description: "The resource has been removed from the index.",
      });
      setResourceToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to de-index resource",
        variant: "destructive",
      });
      setResourceToDelete(null);
    },
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

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
  };

  const handleDeleteConfirm = async () => {
    if (resourceToDelete) {
      await deleteResource.mutateAsync(resourceToDelete);
    }
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
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">
                File Picker
              </CardTitle>
              <CardDescription>
                Select files or folders to index
              </CardDescription>
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
                  <ResourceItem
                    key={resource.resource_id}
                    resource={resource}
                    isSelected={selectedResources.has(resource.resource_id)}
                    onSelect={handleResourceSelect}
                    onClick={handleResourceClick}
                    onDelete={
                      resource.status === "indexed"
                        ? handleDeleteClick
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!resourceToDelete}
        onOpenChange={() => setResourceToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from index?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the file from the index. The file will remain in
              Google Drive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
