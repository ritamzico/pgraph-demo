interface CloseButtonProps {
  onClick: () => void;
  title?: string;
}

export function CloseButton({ onClick, title }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="text-gray-500 hover:text-gray-200 transition-colors w-6 h-6 flex items-center justify-center rounded hover:bg-muted"
    >
      ✕
    </button>
  );
}
