export const getFileNameFromPath = (path: string): string => {
  return path.split('/').pop() || path;
};
