'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Laptop } from '@/types/laptop';
import { Sale } from '@/types/sale';
import { Navbar } from '@/components/navbar';
import { Users, Store, Laptop as LaptopIcon, BarChart3, PieChartIcon } from 'lucide-react';
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

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

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
    const brand = laptop.name.split(' ')[0];
    const qty = laptop.quantity ?? 0;
    const existing = acc.find(d => d.name === brand);
    if (existing) {
      existing.value += qty;
    } else {
      acc.push({ name: brand, value: qty });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen font-sans flex items-center justify-center">
        <div className="glass-card p-8 rounded-3xl text-center font-bold text-slate-700 dark:text-slate-200">
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans px-4 py-6 md:px-8 md:py-10 relative">
      <Navbar />

      <header className="max-w-5xl mx-auto mb-8 text-center">
        <div className="mb-2 flex items-center justify-center min-h-[96px] min-w-[96px]">
          <img
            src="/icon.png"
            alt="LapTrack Logo"
            width={96}
            height={96}
            // @ts-ignore
            fetchPriority="high"
            decoding="async"
            className="h-24 w-24 object-contain drop-shadow-[0_10px_20px_rgba(79,70,229,0.25)] transition-transform hover:scale-105 duration-300"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
          Inventory Statistics & Insights
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mt-1 font-medium">
          Stock levels, brand distribution, and multi-location analytics.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card-hover relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Total Units</CardTitle>
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <LaptopIcon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{totalLaptops}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Recorded inventory count</p>
            </CardContent>
          </Card>

          <Card className="glass-card-hover relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Active Models</CardTitle>
              <div className="p-2 bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Store className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{availableLaptops.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Unique laptop entries</p>
            </CardContent>
          </Card>

          <Card className="glass-card-hover relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Sold-out Models</CardTitle>
              <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{soldLaptops.length}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Laptops with 0 quantity</p>
            </CardContent>
          </Card>

          <Card className="glass-card-hover relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Sales Transactions</CardTitle>
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <BarChart3 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white">{salesRecorded}</div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Recorded sales logs</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Stock Distribution by Shop</span>
              </CardTitle>
              <CardDescription>Stock volume across store locations</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shopData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.85)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
                  />
                  <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span>Top Laptop Brands</span>
              </CardTitle>
              <CardDescription>Manufacturer share in available inventory</CardDescription>
            </CardHeader>
            <CardContent className="h-[320px] pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={brandData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15,23,42,0.85)',
                      backdropFilter: 'blur(12px)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)'
                    }}
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
