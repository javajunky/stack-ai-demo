"use client";

import { useState } from "react";
import { FilePickerProps, Resource } from "@/types/file-picker";
import useFileList from "@/lib/hooks/use-file-list";
import { cn } from "@/lib/utils";
import { Loader2, ChevronRight, File, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const FilePicker = ({
  connectionId,
  onFileSelect,
  onFolderSelect,
}: FilePickerProps) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );

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
    setSelectedResource(resource);

    if (resource.inode_type === "directory") {
      setCurrentPath((prev) => [...prev, resource.resource_id]);
      onFolderSelect?.(resource);
    } else {
      onFileSelect?.(resource);
    }
  };

  const handleBackClick = () => {
    setCurrentPath((prev) => prev.slice(0, -1));
    setSelectedResource(null);
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
        <CardTitle className="text-xl font-semibold">File Picker</CardTitle>
        <CardDescription>Select files or folders to index</CardDescription>
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
              {resources?.map((resource) => (
                <Button
                  key={resource.resource_id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 px-2",
                    selectedResource?.resource_id === resource.resource_id &&
                      "bg-accent"
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
                  {resource.status && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {resource.status}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
