'use client';

import { Navbar } from "@/components/navbar";
import {  BarChart3, Package, ArrowRight, Store, Layers } from "lucide-react";
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
        // compute dealer mapping for the top 5 laptops as a fallback
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

      // also fetch latest 5 for lightweight previews
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
        // collect dealer ids and fetch their names
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans px-4 py-6 md:px-6 md:py-8">
      <header className="max-w-4xl mx-auto mb-8 flex flex-col items-center text-center">
        <div className="mb-0 flex items-center justify-center">
  <img
    src="/icon.png"
    alt="LapTrack Logo"
    className="h-30 w-30 object-contain drop-shadow-lg"
  />
</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-950 dark:text-white mb-3">
          LapTrack
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-7">
          A premium inventory workspace for managing stock and navigating your laptop catalog with clarity.
        </p>
      </header>

      <div className="max-w-5xl mx-auto mb-10">
        <Navbar />
      </div>

      <main className="max-w-6xl mx-auto space-y-10">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-400">Available stock</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{loading ? '...' : totalLaptops}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-400">Mini Tech</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{loading ? '...' : miniTechCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-slate-200/70 bg-white shadow-sm transition-shadow hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-slate-200">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-400">T.M. Com</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{loading ? '...' : tmCommCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="h-2 w-full bg-primary" />
            <CardHeader className="pb-4">
              <div className="p-2 w-fit bg-primary/10 rounded-lg mb-2">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Inventory Management</CardTitle>
              <CardDescription className="text-base">
                Add, search, and manage your laptop stock across multiple shops.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/inventory">
                <Button className="w-full group-hover:translate-x-1 transition-transform">
                  View Inventory <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="h-2 w-full bg-blue-500" />
            <CardHeader className="pb-4">
              <div className="p-2 w-fit bg-blue-500/10 rounded-lg mb-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
              </div>
              <CardTitle className="text-2xl">Visual Statistics</CardTitle>
              <CardDescription className="text-base">
                Get real-time insights into your inventory levels and brand distribution.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stats">
                <Button
  variant="outline"
  className="w-full border-blue-500/20 transition-all duration-300 group-hover:translate-x-1 hover:bg-blue-500 hover:text-white hover:border-blue-500"
>
  View Analytics
  <ArrowRight className="ml-2 h-4 w-4" />
</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Product List below the cards */}
        <section className="space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Recent products</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Latest inventory entries in a clean table format.</p>
            </div>
            <Link href="/inventory">
              <Button variant="outline" className="rounded-full px-4 py-2 text-sm">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200/70 bg-white shadow-sm p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="h-12 w-48 animate-pulse rounded bg-muted mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-16 rounded-2xl bg-muted/50" />
                ))}
              </div>
            </div>
          ) : laptops.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-400">
              <p>No products found. Start by adding one in the inventory.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <table className="min-w-full border-collapse text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.22em] text-xs dark:bg-zinc-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Product</th>
                    <th className="px-5 py-4 font-semibold">Shop</th>
                    <th className="px-5 py-4 font-semibold">Price</th>
                    <th className="px-5 py-4 font-semibold">Specifications</th>
                    <th className="px-5 py-4 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(latestFive.length ? latestFive : laptops.slice(0,5)).map((laptop) => (
                    <tr
                      key={laptop.id}
                      className="border-t border-slate-200/80 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900 cursor-pointer"
                      onClick={() => setSelectedLaptop(laptop)}
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="min-w-0">
                            <span className="block font-semibold text-slate-950 dark:text-white hover:text-primary transition-colors line-clamp-1">
                              {laptop.name}
                            </span>
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Layers className="h-3 w-3" />
                              {latestDealersMap[laptop.id] ?? '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-sm text-slate-700 dark:text-slate-300">{laptop.shop_name}</td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-slate-900 dark:text-white">Rs. {(laptop.cost_price ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-4 align-top text-sm font-semibold text-slate-900 dark:text-white">Rs. {(laptop.sale_price ?? laptop.price ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-4 align-top text-sm text-slate-500 dark:text-slate-400 max-w-[280px]"><p className="line-clamp-2">{laptop.specs}</p></td>
                      <td className="px-5 py-4 align-top text-sm text-primary font-medium"><span className="hover:underline">Preview</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      {selectedLaptop && (
        <div className="max-w-6xl mx-auto mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Preview: {selectedLaptop.name}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Inspect the selected laptop before navigating to the full details page.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/laptops/${selectedLaptop.slug}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-zinc-800 dark:text-slate-200 dark:hover:bg-zinc-900">
                Open details
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSelectedLaptop(null)}>
                Close
              </Button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="space-y-4 rounded-3xl border border-slate-200/70 bg-slate-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div>
                <p className="text-sm text-muted-foreground">Shop</p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{selectedLaptop.shop_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost price</p>
                <p className="mt-1 font-semibold text-primary">Rs. {(selectedLaptop.cost_price ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sale price</p>
                <p className="mt-1 font-semibold text-primary">Rs. {(selectedLaptop.sale_price ?? selectedLaptop.price ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dealers</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{selectedLaptop.dealer_ids?.length ? latestDealersMap[selectedLaptop.id] ?? selectedLaptop.dealer_ids.join(', ') : '—'}</p>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300">
              <p className="text-sm text-muted-foreground">Specifications</p>
              <p className="mt-3 whitespace-pre-line">{selectedLaptop.specs}</p>
            </div>
          </div>
        </div>
      )}

      <section className="mt-20 text-center py-12 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-8">Trusted by our shops</h2>
          <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale">
             <div className="flex items-center gap-2 font-bold text-xl">
               <span className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded flex items-center justify-center text-zinc-100 dark:text-zinc-900">M</span>
               Mini Tech
             </div>
             <div className="flex items-center gap-2 font-bold text-xl">
               <span className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded flex items-center justify-center text-zinc-100 dark:text-zinc-900">T</span>
               T.M. Communication
             </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
        <p>&copy; 2026 Laptop Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}
