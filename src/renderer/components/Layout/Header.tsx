import { Settings, Undo2 } from 'lucide-react';

type HeaderProps = {
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
};

export function Header({ isSettingsOpen, onToggleSettings }: HeaderProps) {
  return (
    <header className="mb-2 flex justify-end px-8">
      <button className="btn btn-ghost btn-circle" onClick={onToggleSettings}>
        {isSettingsOpen ? <Undo2 className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
      </button>
    </header>
  );
}
