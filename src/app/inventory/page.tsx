import { LaptopManagement } from "@/components/laptop-management";
import { Navbar } from "@/components/navbar";

export default function InventoryPage() {
  return (
    <div className="min-h-screen font-sans px-4 py-6 md:px-8 md:py-10 relative">
      <header className="max-w-5xl mx-auto mb-6 flex flex-col items-center text-center">
        <div className="mb-2 flex items-center justify-center">
          <img
            src="/icon.png"
            alt="LapTrack Logo"
            className="h-24 w-24 object-contain drop-shadow-[0_10px_20px_rgba(79,70,229,0.25)] transition-transform hover:scale-105 duration-300"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
          Laptop Catalog & Inventory
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1 font-medium">
          Real-time stock control, model specifications, pricing, and sales tracking.
        </p>
      </header>

      <Navbar />

      <main className="max-w-6xl mx-auto">
        <LaptopManagement />
      </main>
    </div>
  );
}
