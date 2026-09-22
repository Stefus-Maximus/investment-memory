export function AttentionHeatmap({ activity }: { activity: boolean[] }) {
  return (
    <div className="flex shrink-0 items-center gap-1" title="Memory activity" aria-hidden="true">
      {activity.map((active, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-[2px] ${active ? 'bg-blue-500' : 'bg-slate-200'}`}
        />
      ))}
    </div>
  )
}
