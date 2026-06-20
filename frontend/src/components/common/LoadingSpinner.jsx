import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400">
      <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
