export type FileItem = {
  filename: string;
  isDeleted: boolean;
};

export type GitStatus = {
  staged: FileItem[];
  unstaged: FileItem[];
};
