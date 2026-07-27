'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Laptop } from '@/types/laptop';
import { Sale } from '@/types/sale';
import { Navbar } from '@/components/navbar';
import { Users, Store, Laptop as LaptopIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function StatsPage() {
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [{ data: laptopData, error: laptopError }, { data: saleData, error: saleError }] = await Promise.all([
        supabase.from('laptops').select('*'),
        supabase.from('sales').select('*'),
      ]);

      if (!laptopError && laptopData) setLaptops(laptopData);
      if (!saleError && saleData) setSales(saleData);
      setLoading(false);
    }
    fetchData();
  }, []);

  const availableLaptops = laptops.filter(laptop => !laptop.is_sold && (laptop.quantity ?? 0) > 0);
  const soldLaptops = laptops.filter(laptop => laptop.is_sold || (laptop.quantity ?? 0) <= 0);
  const totalLaptops = laptops.reduce((s, l) => s + (l.quantity ?? 0), 0);
  const salesRecorded = sales.length;
  const availableTotal = availableLaptops.reduce((s, l) => s + (l.quantity ?? 0), 0);
  const soldTotal = soldLaptops.reduce((s, l) => s + (l.quantity ?? 0), 0);
  const bestMarginLaptop = [...availableLaptops].sort((a, b) => {
    const profitA = (a.sale_price ?? a.price ?? 0) - (a.cost_price ?? 0);
    const profitB = (b.sale_price ?? b.price ?? 0) - (b.cost_price ?? 0);
    return profitB - profitA;
  })[0];
  
  const shopData = availableLaptops.reduce((acc: any[], laptop) => {
    const qty = laptop.quantity ?? 0;
    const existing = acc.find(d => d.name === laptop.shop_name);
    if (existing) {
      existing.value += qty;
    } else {
      acc.push({ name: laptop.shop_name, value: qty });
    }
    return acc;
  }, []);

  const brandData = availableLaptops.reduce((acc: any[], laptop) => {
    // Extract brand (first word of name)
    const brand = laptop.name.split(' ')[0];
    const qty = laptop.quantity ?? 0;
    const existing = acc.find(d => d.name === brand);
    if (existing) {
      existing.value += qty;
    } else {
      acc.push({ name: brand, value: qty });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6); // Top 6 brands

  if (loading) {
    return <div className="p-8 text-center">Loading statistics...</div>;
  }

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
          Inventory Statistics
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Visual overview of your laptop inventory across all locations.
        </p>
      </header>

      <div className="max-w-5xl mx-auto mb-10">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto space-y-6">
        {/* Key Metrics */}
 <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
  <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">Total laptops</CardTitle>
      <LaptopIcon className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{totalLaptops}</div>
      <p className="text-xs text-muted-foreground mt-1">
        All recorded laptop units
      </p>
    </CardContent>
  </Card>

  <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">Available laptops</CardTitle>
      <Store className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {availableLaptops.length}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        All unique laptop units
      </p>
    </CardContent>
  </Card>

  <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">Sold-out laptops</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {soldLaptops.length}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Laptop records with quantity 0
      </p>
    </CardContent>
  </Card>

  <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">Sales recorded</CardTitle>
      <LaptopIcon className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:scale-110" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">
        {salesRecorded}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        Total sale records in the system
      </p>
    </CardContent>
  </Card>
</div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Distribution by Shop</CardTitle>
              <CardDescription>Comparison of stock levels between shops</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Brands</CardTitle>
              <CardDescription>Distribution of inventory by manufacturer</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
