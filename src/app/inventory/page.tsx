import { LaptopManagement } from "@/components/laptop-management";
import { Laptop } from "lucide-react";
import { Navbar } from "@/components/navbar";

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans px-4 py-6 md:px-6 md:py-8">
      <header className="max-w-5xl mx-auto mb-8 flex flex-col items-center text-center">
        <div className="mb-0 flex items-center justify-center">
  <img
    src="/icon.png"
    alt="LapTrack Logo"
    className="h-30 w-30 object-contain drop-shadow-lg"
  />
</div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Laptop Inventory
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage and track all available laptops across your shops.
        </p>
      </header>

      <div className="max-w-5xl mx-auto mb-10">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto">
        <LaptopManagement />
      </main>
    </div>
  );
}
