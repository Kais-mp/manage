import { Spinner } from '@/components/ui/spinner';
import { Laptop } from 'lucide-react';
import Link from 'next/link';

export default function LoadingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-10 text-center">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-black/20">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary shadow-lg shadow-primary/10 dark:bg-primary/20 dark:text-primary/90">
<div className="mb-0 flex items-center justify-center">
  <img
    src="/icon.png"
    alt="LapTrack Logo"
    className="h-30 w-30 object-contain drop-shadow-lg"
  />
</div>        </div>
        <div className="mt-8 space-y-4">
          <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-900 shadow-inner shadow-slate-200 dark:bg-zinc-900 dark:text-white">
            <Spinner className="h-12 w-12" />
          </div>
        </div>
        
      </div>
    </div>
  );
}
