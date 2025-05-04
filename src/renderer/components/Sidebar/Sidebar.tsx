import React from 'react';

import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Folder, GitBranch } from 'lucide-react';

import { FileTree } from '../FileTree/FileTree';
import { GitControls } from '../GitOps/GitControls';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  hasGitSettings: boolean;
  selectedFile: string | null;
  onFileSelect: (filePath: string) => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  hasGitSettings,
  selectedFile,
  onFileSelect,
  onSettingsClick,
}) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out h-full bg-base-100 rounded-lg shadow-md border border-gray-100 ${
        isOpen ? 'w-1/4 min-w-[260px] opacity-100' : 'w-[2px] min-w-[2px] opacity-80'
      } relative`}
    >
      <button
        className="absolute -right-4 top-4 z-10 btn btn-ghost btn-circle btn-xs border border-base-200 bg-base-100"
        onClick={onToggle}
        tabIndex={-1}
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {/* タブ */}
      <div className={clsx({ hidden: !isOpen, 'tabs tabs-lift h-[calc(100vh-100px)]': isOpen })}>
        {/* ファイルタブ */}
        <label className="tab">
          <input type="radio" name="my_tabs_4" defaultChecked />
          <Folder className="h-4 w-4" />
        </label>
        {/* ファイルタブ内容 */}
        <div className="tab-content bg-base-100 border-base-300">
          <FileTree onFileSelect={onFileSelect} onSettingsClick={onSettingsClick} />
        </div>
        {hasGitSettings && (
          <>
            {/* Gitタブ */}
            <label className="tab">
              <input type="radio" name="my_tabs_4" />
              <GitBranch className="h-4 w-4" />
            </label>

            {/* Gitタブ内容 */}
            <div className="tab-content bg-base-100 border-base-300">
              <GitControls selectedFile={selectedFile} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
