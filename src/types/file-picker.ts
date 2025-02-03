export type InodePath = {
  path: string;
};

export type ResourceStatus = "pending" | "indexed" | "failed" | undefined;

export type Resource = {
  resource_id: string;
  inode_type: "directory" | "file";
  inode_path: InodePath;
  status?: ResourceStatus;
};

export type FilePickerProps = {
  connectionId: string;
  onFileSelect?: (resource: Resource) => void;
  onFolderSelect?: (resource: Resource) => void;
};
