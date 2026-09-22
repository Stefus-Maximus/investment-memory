export function Header({ name }: { name: string | null }) {
  return (
    <header className="flex items-center justify-between">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Welkom{name ? ` ${name}` : ''}
      </h1>
      <div aria-hidden="true" className="h-9 w-9 rounded-full bg-slate-200" />
    </header>
  )
}
