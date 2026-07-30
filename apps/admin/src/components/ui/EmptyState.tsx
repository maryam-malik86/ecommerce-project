interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 p-3 rounded-full" style={{ background: 'var(--ui-bg-component)' }}>
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--ui-fg-base)' }}>{title}</h3>
      {description && (
        <p className="text-xs max-w-xs" style={{ color: 'var(--ui-fg-muted)' }}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
