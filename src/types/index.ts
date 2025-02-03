export interface File {
  id: string;
  name: string;
  type: "file" | "folder";
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  indexed?: boolean;
}
