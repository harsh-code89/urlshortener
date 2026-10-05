export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-zinc-100 mb-4">404</h1>
        <p className="text-xl text-zinc-400 mb-8">Link not found or has been deleted.</p>
        <a href="/" className="text-indigo-400 hover:text-indigo-300 transition underline">Back home</a>
      </div>
    </div>
  )
}
