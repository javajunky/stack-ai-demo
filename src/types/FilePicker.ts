export type InodePath = {
  path: string;
};

export type ResourceStatus =
  | "pending"
  | "indexed"
  | "failed"
  | "resource"
  | undefined;

export type Resource = {
  resource_id: string;
  inode_type: "directory" | "file";
  inode_path: InodePath;
  status?: ResourceStatus;
  knowledge_base_id?: string;
  created_at: string;
  modified_at: string;
};

export type FilePickerProps = {
  connectionId: string;
  onFileSelect?: (resource: Resource) => void;
  onFolderSelect?: (resource: Resource) => void;
};

export type KnowledgeBase = {
  knowledge_base_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  connection_id: string;
  connection_source_ids: string[];
};
