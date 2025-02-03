import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

interface KnowledgeBaseFilesProps {
  kbId: string;
}

export const KnowledgeBaseFiles = ({ kbId }: KnowledgeBaseFilesProps) => {
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading: isLoadingResources } = useQuery({
    queryKey: ["resources", kbId],
    queryFn: async () => {
      const response = await fetch(`/api/resources?kbId=${kbId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      return response.json();
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: async (resourcePath: string) => {
      const response = await fetch(
        `/api/resources?kbId=${kbId}&resourcePath=${encodeURIComponent(
          resourcePath
        )}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete resource");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources", kbId] });
      toast({
        title: "Resource deleted",
        description:
          "The file has been successfully removed from the indexed list.",
      });
      setResourceToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete resource: ${error.message}`,
        variant: "destructive",
      });
      setResourceToDelete(null);
    },
  });

  const handleDeleteResource = (resourcePath: string) => {
    setResourceToDelete(resourcePath);
  };

  const handleConfirmDelete = () => {
    if (resourceToDelete) {
      deleteResourceMutation.mutate(resourceToDelete);
    }
  };

  if (isLoadingResources) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Indexed Files</CardTitle>
          <CardDescription>
            Files currently indexed in your knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {resources?.map((resource: any) => (
              <div
                key={resource.path}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <span className="flex-1 truncate">{resource.path}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteResource(resource.path)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Remove file from index?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the file from your knowledge base
                        index. The original file in Google Drive will not be
                        affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => setResourceToDelete(null)}
                      >
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleConfirmDelete}>
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {resources?.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No files indexed yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
