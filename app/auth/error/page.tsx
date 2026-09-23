import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 bg-white px-4 text-center text-slate-900">
      <p className="text-base font-semibold text-slate-900">Inloglink verlopen of ongeldig</p>
      <p className="text-sm text-slate-500">
        Vraag in je profiel een nieuwe inloglink aan en probeer het opnieuw.
      </p>
      <Link href="/" className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        Terug naar home
      </Link>
    </main>
  )
}
