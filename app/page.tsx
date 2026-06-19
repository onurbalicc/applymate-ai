export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xl font-bold text-white shadow-lg">
          A
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          ApplyMate{" "}
          <span className="bg-gradient-to-r from-violet-500 to-indigo-600 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
      </div>
      <p className="max-w-md text-lg text-zinc-500 dark:text-zinc-400">
        Your AI-powered job application assistant. Analyze job descriptions,
        match your CV, and generate tailored application materials.
      </p>
      <div className="mt-2 rounded-full border border-zinc-200 px-4 py-2 text-sm text-zinc-400 dark:border-zinc-800">
        🚧 Coming soon — scaffold ready
      </div>
    </div>
  );
}
