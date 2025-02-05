"use client";

import { useState } from "react";
import { FilePickerProps, Resource } from "@/types/FilePicker";
import useFileList from "@/lib/hooks/use-file-list";
import { Loader2, ChevronRight, Check, Home, Plus } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { TooltipProvider } from "@/components/ui/tooltip";

interface PathSegment {
  id: string;
  name: string;
}

export const FilePicker = ({
  connectionId,
  onFileSelect,
  onFolderSelect,
}: FilePickerProps) => {
  const [currentPath, setCurrentPath] = useState<PathSegment[]>([]);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(
    new Set()
  );
  const [sortBy, setSortBy] = useState<"name" | "date">("name");
  const [filterText, setFilterText] = useState("");
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(
    null
  );
  const [isIndexing, setIsIndexing] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const currentResourceId =
    currentPath.length > 0 ? currentPath[currentPath.length - 1].id : undefined;

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
      // Instead of making a DELETE request, we'll just update the status
      return Promise.resolve({
        ...resource,
        status: "deleted",
      });
    },
    onSuccess: (updatedResource) => {
      // Update the cache with the new status
      queryClient.setQueryData(
        ["files", connectionId, currentResourceId],
        (oldData: Resource[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((r) =>
            r.resource_id === updatedResource.resource_id ? updatedResource : r
          );
        }
      );

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

  const createKnowledgeBase = useMutation({
    mutationFn: async (resources: Resource[]) => {
      const connection_source_ids = resources.map((r) => r.resource_id);
      console.log("Selected resources:", resources);
      console.log("Connection ID:", connectionId);
      console.log("Resource IDs:", connection_source_ids);

      const requestBody = {
        connection_id: connectionId,
        connection_source_ids,
        name: "Test Knowledge Base",
        description: "Files indexed from Google Drive",
        indexing_params: {
          ocr: false,
          unstructured: true,
          embedding_params: {
            embedding_model: "text-embedding-ada-002",
            api_key: null,
          },
          chunker_params: {
            chunk_size: 1500,
            chunk_overlap: 500,
            chunker: "sentence",
          },
        },
        org_level_role: null,
        cron_job_id: null,
      };

      console.log("Creating knowledge base with:", requestBody);

      const response = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to create knowledge base:", error);
        throw new Error(error.error || "Failed to create knowledge base");
      }

      const data = await response.json();
      console.log("Knowledge base created:", data);
      return { data, resources };
    },
    onSuccess: ({ data, resources }) => {
      // Update the resources with pending status
      const updatedResources = resources.map((resource) => ({
        ...resource,
        status: "pending" as const,
        knowledge_base_id: data.knowledge_base_id,
      }));

      // Update the cache with the new status
      queryClient.setQueryData(["files"], (oldData: Resource[] | undefined) => {
        if (!oldData) return oldData;
        const newData = [...oldData];
        updatedResources.forEach((updatedResource) => {
          const index = newData.findIndex(
            (r) => r.resource_id === updatedResource.resource_id
          );
          if (index !== -1) {
            newData[index] = updatedResource;
          }
        });
        return newData;
      });

      // Invalidate both files and knowledge-base queries
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-base"] });

      toast({
        title: "Knowledge base created",
        description: "Starting indexing process...",
      });

      // Clear selected resources
      setSelectedResources(new Set());
      setIsIndexing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create knowledge base",
        variant: "destructive",
      });
      setIsIndexing(false);
    },
  });

  const sortedAndFilteredResources = resources
    ?.map((resource) => ({
      ...resource,
      status: resource.status === "resource" ? "indexed" : resource.status,
    }))
    .filter((resource) =>
      resource.inode_path.path.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "name") {
        // Sort by type first (directories before files) only when sorting by name
        if (a.inode_type !== b.inode_type) {
          return a.inode_type === "directory" ? -1 : 1;
        }
        return a.inode_path.path.localeCompare(b.inode_path.path);
      }
      // When sorting by date, ignore type and sort purely by date
      return (
        new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime()
      );
    });

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const handleResourceClick = (resource: Resource) => {
    if (resource.inode_type === "directory") {
      const pathName =
        resource.inode_path.path.split("/").filter(Boolean).pop() || "Unknown";
      setCurrentPath((prev) => [
        ...prev,
        { id: resource.resource_id, name: pathName },
      ]);
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

  const handleIndexSelected = async () => {
    const selectedFiles =
      resources?.filter((r) => selectedResources.has(r.resource_id)) || [];
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to index",
        variant: "destructive",
      });
      return;
    }

    setIsIndexing(true);
    await createKnowledgeBase.mutateAsync(selectedFiles);
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
    <TooltipProvider>
      <>
        <Card className="w-full">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold">
                    File Picker
                  </CardTitle>
                  <CardDescription>
                    Select files or folders to index
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleIndexSelected}
                  disabled={selectedResources.size === 0 || isIndexing}
                >
                  {isIndexing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Indexing...
                    </>
                  ) : (
                    "Index Selected Files"
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-blue-300 hover:bg-blue-400 border border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Add"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <div className="flex items-center gap-2 p-2 border-b bg-muted/10">
            <div className="flex items-center flex-1 gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentPath([])}
                disabled={currentPath.length === 0}
                className="h-9 w-9"
                aria-label="Go to root"
              >
                <Home className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackClick}
                disabled={currentPath.length === 0}
                className="h-9 w-9"
                aria-label="Go back"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <Breadcrumb>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => setCurrentPath([])}>
                    My Drive
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {currentPath.map((segment, index) => (
                  <BreadcrumbItem key={segment.id}>
                    <BreadcrumbLink
                      onClick={() =>
                        setCurrentPath(currentPath.slice(0, index + 1))
                      }
                    >
                      {segment.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter by name..."
                value={filterText}
                onChange={handleFilterChange}
                className="w-64"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Sort By: {sortBy}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white">
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

          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedAndFilteredResources?.map((resource) => (
                  <ResourceItem
                    key={resource.resource_id}
                    resource={resource}
                    isSelected={selectedResources.has(resource.resource_id)}
                    onSelect={handleResourceSelect}
                    onResourceClick={handleResourceClick}
                    onDelete={
                      resource.status !== "deleted"
                        ? handleDeleteClick
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog
          open={!!resourceToDelete}
          onOpenChange={() => setResourceToDelete(null)}
        >
          <AlertDialogContent className="z-[100]">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove from index?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the file from the index. The file will remain
                in Google Drive.
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
    </TooltipProvider>
  );
};
