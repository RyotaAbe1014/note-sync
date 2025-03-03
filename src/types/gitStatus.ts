export type GitFileStatus = {
  filename: string;
  isDeleted: boolean;
}

export type GitStatus = {
  staged: GitFileStatus[];
  unstaged: GitFileStatus[];
}

// ステージの組み合わせの定義
export type Filename = string

// HEAD内のファイル状態
export const HeadStatus = {
  ABSENT: 0,  // HEADに存在しない
  PRESENT: 1  // HEADに存在する
} as const

// ワーキングディレクトリ内のファイル状態
export const WorkdirStatus = {
  ABSENT: 0,   // ワーキングディレクトリに存在しない
  IDENTICAL: 1, // HEADと同一
  MODIFIED: 2   // HEADから変更あり
} as const

// ステージング状態
export const StageStatus = {
  ABSENT: 0,    // ステージングエリアに存在しない
  IDENTICAL: 1,  // HEADと同一
  MODIFIED: 2,   // HEADから変更あり
  MODIFIED_AGAIN: 3 // ステージング後にさらに変更あり
} as const



// ステータスの組み合わせ例:
// [0,2,0]: "Untracked" - 新規ファイル（未追跡）
// [0,2,2]: "Added" - git add 済み
// [0,2,3]: "Added & Modified" - git add 済み & さらに変更あり
// [1,1,1]: "Unmodified" - 変更なし
// [1,2,1]: "Modified" - 変更あり（未ステージング）
// [1,2,2]: "Staged" - git add 済み
// [1,2,3]: "Staged & Modified" - git add 済み & さらに変更あり
// [1,0,1]: "Deleted" - 削除（未ステージング）
// [1,0,0]: "Deleted (Staged)" - 削除（ステージング済み）
// [1,2,0]: "Deleted & New" - 削除後、同じ名前の新しいファイルが作られた
// [1,1,0]: "Deleted & Modified" - 削除後、同じ名前で変更された

export type StatusRow = [Filename, typeof HeadStatus[keyof typeof HeadStatus], typeof WorkdirStatus[keyof typeof WorkdirStatus], typeof StageStatus[keyof typeof StageStatus]]

export type StatusMatrix = StatusRow[]