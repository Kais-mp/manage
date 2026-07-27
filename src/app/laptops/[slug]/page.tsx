'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Laptop } from '@/types/laptop';
import { Dealer } from '@/types/dealer';
import { Sale } from '@/types/sale';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Cpu, Store, Layers, BadgeDollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function LaptopDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    async function fetchLaptop() {
      setLoading(true);
      const { data, error } = await supabase
        .from('laptops')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        toast.error('Laptop not found');
      } else {
        setLaptop(data);
        // fetch related dealers if any
        if (data.dealer_ids && data.dealer_ids.length > 0) {
          const { data: dealerData } = await supabase.from('dealers').select('*').in('id', data.dealer_ids);
          if (dealerData) setDealers(dealerData);
        }
        // fetch related sales
        const { data: salesData } = await supabase
          .from('sales')
          .select('*')
          .or(`laptop_id.eq.${data.id},items.cs.[{"laptop_id":"${data.id}"}]`)
          .order('date', { ascending: false });
        if (salesData) setSales(salesData);
      }
      setLoading(false);
    }

    fetchLaptop();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading laptop details...</div>
      </div>
    );
  }

  if (!laptop) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Laptop not found</h1>
        <Link href="/inventory">
          <Button>Back to Inventory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Navbar />
        
        <Link href="/inventory" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-primary mb-6 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Inventory
        </Link>

        <div className="grid grid-cols-1 gap-12">
          {/* Details */}
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-bold">
                  {laptop.shop_name}
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {laptop.name}
              </h1>
                <div className="flex items-center gap-2 text-3xl font-bold text-primary">
                  <BadgeDollarSign className="h-8 w-8" />
                  Rs. {laptop.price.toLocaleString()}
                </div>
            </div>

            <Card className="border-none bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
              <div className="h-1.5 w-full bg-primary" />
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Cpu className="h-4 w-4" /> Technical Specifications
                  </h3>
                  <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {laptop.specs}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                      <Store className="h-3 w-3" /> Availability
                    </p>
                    <p className="font-semibold">{laptop.shop_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Added On
                    </p>
                    <p className="font-semibold">
                      {laptop.created_at ? new Date(laptop.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Series
                    </p>
                    <p className="font-semibold">{laptop.series}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dealers and Sales */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="bg-white dark:bg-zinc-900 shadow-md">
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Dealers</h4>
                  {dealers.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No dealers assigned to this laptop.</p>
                  ) : (
                    <div className="mt-3 grid gap-2">
                      {dealers.map((d) => (
                        <div key={d.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-muted/5">
                          <div>
                            <p className="font-semibold">{d.name}</p>
                            <p className="text-sm text-muted-foreground">{d.contact}</p>
                          </div>
                          {d.remarks && <p className="text-sm text-muted-foreground hidden sm:block">{d.remarks}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-zinc-900 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">Sales</h4>
                    <span className="text-xs text-muted-foreground">{sales.length} records</span>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    {sales.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4">No sales recorded for this laptop.</p>
                    ) : (
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs text-zinc-500 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Customer</th>
                            <th className="px-3 py-2">Phone</th>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sales.map((s) => (
                            <tr key={s.id} className="border-t border-zinc-100 dark:border-zinc-800">
                              <td className="px-3 py-3 font-medium">{s.customer_name}</td>
                              <td className="px-3 py-3">{s.phone}</td>
                              <td className="px-3 py-3">{s.date}</td>
                              <td className="px-3 py-3 text-muted-foreground max-w-xs truncate">{s.remarks || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-auto">
               <Link href="/inventory">
                 <Button variant="outline" className="w-full py-6 text-lg rounded-2xl border-2">
                   Edit Inventory
                 </Button>
               </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
