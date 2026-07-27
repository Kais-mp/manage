'use client';

import { Navbar } from "@/components/navbar";
import { BarChart3, Package, ArrowRight, Store, Layers, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Laptop as LaptopType } from "@/types/laptop";

export default function Home() {
  const [laptops, setLaptops] = useState<LaptopType[]>([]);
  const [latestFive, setLatestFive] = useState<LaptopType[]>([]);
  const [latestDealersMap, setLatestDealersMap] = useState<Record<string, string>>({});
  const [selectedLaptop, setSelectedLaptop] = useState<LaptopType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      const { data, error } = await supabase
        .from('laptops')
        .select('*')
        .eq('is_sold', false)
        .gt('quantity', 0)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const fixedAll = (data as any[]).map((l) => ({ ...l, series: l.series ?? '' }));
        setLaptops(fixedAll as LaptopType[]);
        const topFive = fixedAll.slice(0, 5);
        const dealerIds = Array.from(new Set(topFive.flatMap((l: any) => l.dealer_ids || [])));
        if (dealerIds.length > 0) {
          const { data: dealersData } = await supabase.from('dealers').select('id,name').in('id', dealerIds);
          const dealersById: Record<string, string> = {};
          (dealersData || []).forEach((d: any) => { dealersById[d.id] = d.name; });
          const map: Record<string, string> = {};
          topFive.forEach((l: any) => {
            if (l.dealer_ids && l.dealer_ids.length > 0) {
              map[l.id] = l.dealer_ids.map((id: string) => dealersById[id] || id).join(', ');
            } else {
              map[l.id] = '—';
            }
          });
          setLatestDealersMap(map);
        }
      }

      const { data: latestData } = await supabase
        .from('laptops')
        .select('id, name, slug, cost_price, sale_price, shop_name, specs, created_at, dealer_ids')
        .eq('is_sold', false)
        .gt('quantity', 0)
        .order('created_at', { ascending: false })
        .limit(5);
      if (latestData) {
        const fixed = (latestData as any[]).map((l) => ({ ...l, series: l.series ?? '' }));
        setLatestFive(fixed as LaptopType[]);
        const dealerIds = Array.from(new Set(latestData.flatMap((l: any) => l.dealer_ids || [])));
        if (dealerIds.length > 0) {
          const { data: dealersData } = await supabase.from('dealers').select('id,name').in('id', dealerIds);
          const dealersById: Record<string, string> = {};
          (dealersData || []).forEach((d: any) => { dealersById[d.id] = d.name; });
          const map: Record<string, string> = {};
          latestData.forEach((l: any) => {
            if (l.dealer_ids && l.dealer_ids.length > 0) {
              map[l.id] = l.dealer_ids.map((id: string) => dealersById[id] || id).join(', ');
            } else {
              map[l.id] = '—';
            }
          });
          setLatestDealersMap(map);
        }
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  const availableLaptops = laptops.filter(l => !l.is_sold && (l.quantity ?? 0) > 0);
  const totalLaptops = availableLaptops.reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  const miniTechCount = availableLaptops
    .filter(l => l.shop_name === 'Mini Tech')
    .reduce((sum, l) => sum + (l.quantity ?? 0), 0);
  const tmCommCount = availableLaptops
    .filter(l => l.shop_name === 'T.M. Communication')
    .reduce((sum, l) => sum + (l.quantity ?? 0), 0);

  return (
    <div className="min-h-screen font-sans px-4 py-6 md:px-8 md:py-10 relative">
      <header className="max-w-4xl mx-auto mb-6 flex flex-col items-center text-center">
        <div className="mb-2 flex items-center justify-center">
          <img
            src="/icon.png"
            alt="LapTrack Logo"
            className="h-28 w-28 object-contain drop-shadow-[0_10px_20px_rgba(79,70,229,0.25)] transition-transform hover:scale-105 duration-300"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Next-Gen Laptop Inventory Workspace</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent mb-3">
          LapTrack
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          A high-performance glassmorphic workspace to track stock, manage dealer network, and monitor sales across your locations.
        </p>
      </header>

      <Navbar />

      <main className="max-w-6xl mx-auto space-y-10">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-card-hover group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Available Stock</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : totalLaptops}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-sm">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Mini Tech</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : miniTechCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-hover group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-bl-full pointer-events-none transition-all group-hover:scale-110" />
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shadow-sm">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">T.M. Communication</p>
                  <p className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">{loading ? '...' : tmCommCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="group relative overflow-hidden border border-white/60 dark:border-white/10">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 to-violet-600" />
            <CardHeader className="pb-4 pt-6">
              <div className="p-3 w-fit bg-indigo-500/10 rounded-2xl mb-2 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Package className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">Inventory Management</CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                Add, edit, filter and track your complete laptop inventory across shops.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Link href="/inventory">
                <Button className="w-full justify-between">
                  <span>Explore Inventory</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border border-white/60 dark:border-white/10">
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 to-cyan-500" />
            <CardHeader className="pb-4 pt-6">
              <div className="p-3 w-fit bg-sky-500/10 rounded-2xl mb-2 border border-sky-500/20 text-sky-600 dark:text-sky-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold">Visual Analytics</CardTitle>
              <CardDescription className="text-base text-slate-600 dark:text-slate-300">
                Gain real-time insights into stock valuation, brand split, and sales breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Link href="/stats">
                <Button variant="secondary" className="w-full justify-between">
                  <span>View Statistics</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Product List */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Recent Inventory</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest laptop models available across stores.</p>
            </div>
            <Link href="/inventory">
              <Button variant="outline" size="sm" className="rounded-full">
                View full catalog <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <Card className="p-8">
              <div className="h-8 w-48 animate-pulse rounded bg-slate-200/60 dark:bg-slate-800/60 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-14 rounded-2xl bg-slate-200/40 dark:bg-slate-800/40 animate-pulse" />
                ))}
              </div>
            </Card>
          ) : laptops.length === 0 ? (
            <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
              <p>No laptops in stock. Add laptops from the inventory page.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100/70 dark:bg-slate-800/50 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 uppercase tracking-wider text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-5 py-4">Product Name</th>
                      <th className="px-5 py-4">Store</th>
                      <th className="px-5 py-4">Cost Price</th>
                      <th className="px-5 py-4">Selling Price</th>
                      <th className="px-5 py-4">Specifications</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                    {(latestFive.length ? latestFive : laptops.slice(0, 5)).map((laptop) => (
                      <tr
                        key={laptop.id}
                        className="transition-colors hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 cursor-pointer"
                        onClick={() => setSelectedLaptop(laptop)}
                      >
                        <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                          <div className="min-w-0">
                            <span className="block font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1">
                              {laptop.name}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <Layers className="h-3 w-3" />
                              {latestDealersMap[laptop.id] ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium">{laptop.shop_name}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">Rs. {(laptop.cost_price ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">Rs. {(laptop.sale_price ?? laptop.price ?? 0).toLocaleString()}</td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 max-w-xs">
                          <p className="line-clamp-1 text-xs">{laptop.specs}</p>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10">
                            Preview
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        {selectedLaptop && (
          <Card className="border-2 border-indigo-500/30">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">Preview: {selectedLaptop.name}</CardTitle>
                  <CardDescription>Quick overview of selected product specs and pricing.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/laptops/${selectedLaptop.slug}`}>
                    <Button variant="default" size="sm">
                      Open Full Details
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setSelectedLaptop(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 pt-2">
              <div className="space-y-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 p-4 border border-slate-200/70 dark:border-white/10 text-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Store</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedLaptop.shop_name}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Cost Price</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Rs. {(selectedLaptop.cost_price ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Selling Price</span>
                  <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">Rs. {(selectedLaptop.sale_price ?? selectedLaptop.price ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Linked Dealers</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedLaptop.dealer_ids?.length ? latestDealersMap[selectedLaptop.id] ?? selectedLaptop.dealer_ids.join(', ') : '—'}</p>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 p-4 border border-slate-200/70 dark:border-white/10 text-sm">
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Specifications</span>
                <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLaptop.specs}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <section className="mt-16 text-center py-10 border-t border-slate-200/60 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500 mb-6">Connected Stores</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-70">
            <div className="flex items-center gap-2.5 font-bold text-lg text-slate-800 dark:text-slate-200">
              <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm shadow-md">M</span>
              Mini Tech
            </div>
            <div className="flex items-center gap-2.5 font-bold text-lg text-slate-800 dark:text-slate-200">
              <span className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm shadow-md">T</span>
              T.M. Communication
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-16 pt-6 border-t border-slate-200/60 dark:border-white/10 text-center text-xs text-slate-500">
        <p>&copy; 2026 LapTrack Inventory System. All rights reserved.</p>
      </footer>
    </div>
  );
}
