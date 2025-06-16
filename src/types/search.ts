export interface ISearchOptions {
  searchIn: 'filename' | 'content' | 'both';
  caseSensitive?: boolean;
  useRegex?: boolean;
  maxResults?: number;
  excludeDirs?: string[];
}

export interface ISearchResult {
  path: string;
  name: string;
  matches?: {
    line: number;
    content: string;
    highlight: [number, number];
  }[];
}
