import { Spinner } from '@/components/ui/spinner';
import { Laptop } from 'lucide-react';

interface LoadingScreenProps {
  open?: boolean;
}

export function LoadingScreen({ open = true }: LoadingScreenProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
      <div className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-slate-200/80 bg-white/95 p-8 shadow-2xl shadow-slate-200/50 dark:border-zinc-800 dark:bg-zinc-950/95 dark:shadow-black/20">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10 dark:bg-primary/20 dark:text-primary/90">
<img
    src="/icon.png"
    alt="LapTrack Logo"
    className="h-30 w-30 object-contain drop-shadow-lg"
  />          </div>
          <div className="space-y-4">
            <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-inner shadow-slate-200 dark:bg-zinc-900 dark:text-white">
              <Spinner className="h-12 w-12" />
            </div>
            <p className="text-sm font-semibold text-slate-950 dark:text-white">Loading LapTrack</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Preparing your inventory workspace. Please wait a moment.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
