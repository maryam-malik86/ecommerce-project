interface BadgeProps {
  variant: 'neutral' | 'green' | 'orange' | 'red' | 'blue' | 'purple';
  children: React.ReactNode;
  dot?: boolean;
}

const dotColors: Record<BadgeProps['variant'], string> = {
  neutral: 'var(--ui-fg-muted)',
  green:   '#16a34a',
  orange:  '#ea580c',
  red:     '#dc2626',
  blue:    '#2563eb',
  purple:  '#7c3aed',
};

export default function Badge({ variant, children, dot = false }: BadgeProps) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full inline-block"
          style={{ background: dotColors[variant] }}
        />
      )}
      {children}
    </span>
  );
}

// Helpers for common statuses
export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    pending:    { variant: 'orange', label: 'Pending' },
    confirmed:  { variant: 'blue',   label: 'Confirmed' },
    processing: { variant: 'purple', label: 'Processing' },
    shipped:    { variant: 'blue',   label: 'Shipped' },
    delivered:  { variant: 'green',  label: 'Delivered' },
    cancelled:  { variant: 'red',    label: 'Cancelled' },
    refunded:   { variant: 'neutral',label: 'Refunded' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    active:   { variant: 'green',  label: 'Active' },
    inactive: { variant: 'orange', label: 'Inactive' },
    archived: { variant: 'neutral',label: 'Archived' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    paid:           { variant: 'green',  label: 'Paid' },
    unpaid:         { variant: 'red',    label: 'Unpaid' },
    partially_paid: { variant: 'orange', label: 'Partial' },
    refunded:       { variant: 'neutral',label: 'Refunded' },
  };
  const cfg = map[status] ?? { variant: 'neutral', label: status };
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>;
}

export function StockBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0)        return <Badge variant="red" dot>Out of Stock</Badge>;
  if (qty <= threshold) return <Badge variant="orange" dot>Low Stock</Badge>;
  return <Badge variant="green" dot>In Stock</Badge>;
}
