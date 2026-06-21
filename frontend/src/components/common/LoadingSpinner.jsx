export default function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-400">
      <div className="relative flex h-14 w-14 items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-t-violet-500 border-r-cyan-400 border-b-indigo-500 border-l-transparent animate-spin duration-1000" />
        {/* Inner reverse rotating ring */}
        <div className="absolute h-8 w-8 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-violet-500 border-l-indigo-500 animate-spin duration-700 [animation-direction:reverse]" />
        {/* Center core pulse */}
        <div className="absolute h-3 w-3 rounded-full bg-indigo-500/80 animate-ping" />
      </div>
      {label && (
        <span className="text-sm font-medium tracking-wide text-slate-300 animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
