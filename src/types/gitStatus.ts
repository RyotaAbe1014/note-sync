export type GitFileStatus = {
  filename: string;
  isDeleted: boolean;
};

export type GitStatus = {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
};

export type Filename = string;

// HEAD内のファイル状態
export const HeadStatus = {
  ABSENT: 0, // HEADに存在しない
  PRESENT: 1, // HEADに存在する
} as const;

// ワーキングディレクトリ内のファイル状態
export const WorkdirStatus = {
  ABSENT: 0, // ワーキングディレクトリに存在しない
  IDENTICAL: 1, // HEADと同一
  MODIFIED: 2, // HEADから変更あり
} as const;

// ステージング状態
export const StageStatus = {
  ABSENT: 0, // ステージングエリアに存在しない
  IDENTICAL: 1, // HEADと同一
  MODIFIED: 2, // HEADから変更あり
  MODIFIED_AGAIN: 3, // ステージング後にさらに変更あり
} as const;

export type StatusRow = [
  Filename,
  (typeof HeadStatus)[keyof typeof HeadStatus],
  (typeof WorkdirStatus)[keyof typeof WorkdirStatus],
  (typeof StageStatus)[keyof typeof StageStatus],
];

export type StatusMatrix = StatusRow[];
