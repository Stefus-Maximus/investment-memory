export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {actionLabel}
      </button>
    </div>
  )
}
