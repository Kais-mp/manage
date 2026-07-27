'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchAdminActivity } from '@/lib/admin-activity';
import { isAdminUser } from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Activity, AlertTriangle, Download, DollarSign, Laptop, Package, RefreshCcw, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function formatDateTime(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString()}`;
}

const CHART_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export function SudoAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [authorized, setAuthorized] = useState(false);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const ACTIVITY_PAGE_SIZE = 20;
  const [stats, setStats] = useState({
    laptops: 0,
    inventoryCostValue: 0,
    inventorySaleValue: 0,
    profitPotential: 0,
    totalUnits: 0,
    lowStockCount: 0,
    sales: 0,
    revenue: 0,
  });
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [laptops, setLaptops] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);

  const inventoryByShop = useMemo(() => {
    const grouped = inventoryData.reduce((acc: Record<string, any>, item: any) => {
      const shop = item.shop_name || 'Unknown';
      const quantity = Number(item.quantity ?? 0);
      const saleValue = Number(item.sale_price ?? item.price ?? 0) * quantity;
      const costValue = Number(item.cost_price ?? 0) * quantity;

      if (!acc[shop]) {
        acc[shop] = { name: shop, quantity: 0, saleValue: 0, costValue: 0 };
      }

      acc[shop].quantity += quantity;
      acc[shop].saleValue += saleValue;
      acc[shop].costValue += costValue;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [inventoryData]);

  const lowStockByShop = useMemo(() => {
    const grouped = inventoryData
      .filter((item: any) => {
        const qty = Number(item.quantity ?? 0);
        return qty > 0 && qty <= 2;
      })
      .reduce((acc: Record<string, any>, item: any) => {
        const shop = item.shop_name || 'Unknown';
        if (!acc[shop]) acc[shop] = { name: shop, value: 0 };
        acc[shop].value += 1;
        return acc;
      }, {} as Record<string, any>);

    return Object.values(grouped);
  }, [inventoryData]);

  async function loadAdminData() {
    try {
      const [{ data: laptopData, error: laptopError }, { data: salesData, error: salesError }, { data: batchSalesData, error: batchSalesError }] = await Promise.all([
        supabase.from('laptops').select('*'),
        supabase.from('sales').select('*'),
        supabase.from('batch_sales').select('*'),
      ]);

      if (!laptopError) {
        const items = laptopData || [];
        const inventoryCostValue = items.reduce((sum: number, item: any) => sum + Number(item.cost_price ?? 0) * Number(item.quantity ?? 1), 0);
        const inventorySaleValue = items.reduce((sum: number, item: any) => sum + Number(item.sale_price ?? item.price ?? 0) * Number(item.quantity ?? 1), 0);
        const profitPotential = inventorySaleValue - inventoryCostValue;
        const totalUnits = items.reduce((sum: number, item: any) => sum + Number(item.quantity ?? 1), 0);
        const lowStockCount = items.filter((item: any) => {
          const qty = Number(item.quantity ?? 0);
          return qty > 0 && qty <= 2;
        }).length || 0;

        setStats((current) => ({
          ...current,
          laptops: items?.length || 0,
          inventoryCostValue,
          inventorySaleValue,
          profitPotential,
          totalUnits,
          lowStockCount,
        }));

        setInventoryData(items);
        setLaptops(items.slice(0, 10));
      }

      const rawSales = salesError ? [] : (salesData || []);
      const rawBatchSales = batchSalesError ? [] : (batchSalesData || []);
      const salesItems = [...rawSales, ...rawBatchSales].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createdB - createdA;
      });

      const revenue = salesItems.reduce((sum: number, item: any) => {
        if (item.items && Array.isArray(item.items) && item.items.length > 0) {
          return sum + item.items.reduce((s: number, i: any) => s + ((i.quantity ?? 1) * (i.unit_price ?? 0)), 0);
        }
        return sum + Number(item.sale_price ?? 0);
      }, 0);
      setStats((current) => ({ ...current, sales: salesItems?.length || 0, revenue }));
      setSales(salesItems.slice(0, 10));
    } catch {
      // ignore data loading issues
    }

    const activityResult = await fetchAdminActivity(activityPage, ACTIVITY_PAGE_SIZE);
    setActivity(activityResult.items || []);
    setActivityTotal(activityResult.count || 0);
  }

  useEffect(() => {
    let active = true;

    async function boot() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (!isAdminUser(user)) {
        router.replace('/sudo/login');
        return;
      }

      setSessionUser(user);
      setAuthorized(true);
      await loadAdminData();
      setLoading(false);
    }

    boot();
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      const isAdmin = isAdminUser(currentUser);
      setSessionUser(currentUser);
      setAuthorized(isAdmin);

      if (!isAdmin) {
        router.replace('/sudo/login');
        return;
      }

      await loadAdminData();
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSessionUser(null);
    setAuthorized(false);
    toast.success('Signed out');
  }

  async function loadActivity(page = 1) {
    const activityResult = await fetchAdminActivity(page, ACTIVITY_PAGE_SIZE);
    setActivity(activityResult.items);
    setActivityTotal(activityResult.count);
  }

  async function refreshDashboard() {
    setIsRefreshing(true);
    try {
      await loadAdminData();
      await loadActivity(activityPage);
      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Unable to refresh dashboard');
    } finally {
      setIsRefreshing(false);
    }
  }

  function downloadInventoryCsv() {
    if (!inventoryData || inventoryData.length === 0) {
      toast.error('No inventory available to export');
      return;
    }

    const headers = ['Name', 'Description', 'Shop', 'Quantity', 'Cost Price', 'Sale Price', 'Inventory Cost', 'Inventory Sale Value'];
    const rows = inventoryData.map((item) => {
      const quantity = Number(item.quantity ?? 1);
      const description = item.description ?? item.specs ?? '';
      const costValue = Number(item.cost_price ?? 0) * quantity;
      const saleValue = Number(item.sale_price ?? item.price ?? 0) * quantity;
      return [
        item.name ?? '',
        description,
        item.shop_name ?? '',
        quantity.toString(),
        Number(item.cost_price ?? 0).toString(),
        Number(item.sale_price ?? item.price ?? 0).toString(),
        costValue.toString(),
        saleValue.toString(),
      ];
    });

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  }

  const accessMessage = useMemo(() => {
    if (!sessionUser) return 'Use a verified admin account to access this area.';
    if (!authorized) return 'Your account is signed in, but it does not have admin privileges.';
    return 'Admin access is active.';
  }, [sessionUser, authorized]);

  const bestMarginLaptop = useMemo(() => {
    if (!inventoryData || inventoryData.length === 0) return null;
    return inventoryData.reduce((best: any | null, item: any) => {
      const margin = Number(item.sale_price ?? item.price ?? 0) - Number(item.cost_price ?? 0);
      if (!best || margin > best.margin) {
        return { ...item, margin };
      }
      return best;
    }, null);
  }, [inventoryData]);

  if (loading) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Loading admin panel…</div>;
  }

  if (!sessionUser || !authorized) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Redirecting to admin sign in…</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Internal admin console</p>
            <h1 className="text-3xl font-semibold tracking-tight">Sudo control center</h1>
            <p className="mt-2 text-sm text-muted-foreground">Monitor inventory, sales, and the invisible activity trail across the app.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={refreshDashboard} disabled={isRefreshing}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {isRefreshing ? 'Refreshing…' : 'Refresh dashboard'}
            </Button>
            <Button variant="secondary" onClick={downloadInventoryCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export inventory CSV
            </Button>
            <Button variant="secondary" onClick={handleSignOut}>Sign out</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Active inventory</CardDescription>
              <CardTitle className="text-2xl">{stats.laptops}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Laptop className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              laptop models tracked
            </CardContent>
          </Card>

          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Total stock units</CardDescription>
              <CardTitle className="text-2xl">{stats.totalUnits}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              units in inventory
            </CardContent>
          </Card>

          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Low stock alerts</CardDescription>
              <CardTitle className="text-2xl">{stats.lowStockCount}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              items with quantity 2 or less
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Cost basis value</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.inventoryCostValue)}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              cost price sum for stock
            </CardContent>
          </Card>

          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Sale value</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.inventorySaleValue)}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              sale price valuation
            </CardContent>
          </Card>

          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader className="pb-2">
              <CardDescription>Potential profit</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(stats.profitPotential)}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
              estimated margin across inventory
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader>
              <CardTitle>Inventory value by shop</CardTitle>
              <CardDescription>Cost vs sale value across all shop locations.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryByShop} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="costValue" name="Cost Value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saleValue" name="Sale Value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="group bg-white dark:bg-zinc-900 border-none shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:[transform:perspective(1000px)_rotateX(4deg)_rotateY(-4deg)]">
            <CardHeader>
              <CardTitle>Low stock distribution</CardTitle>
              <CardDescription>Where limited inventory is concentrated.</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              {!lowStockByShop || lowStockByShop.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No low stock items at the moment.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lowStockByShop} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={4}>
                      {lowStockByShop.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Who edited laptops, logged sales, or removed stock and when.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!activity || activity.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">No activity captured yet.</TableCell>
                    </TableRow>
                  ) : (
                    activity.map((entry) => (
                      <TableRow key={entry.id || `${entry.created_at}-${entry.action}`}>
                        <TableCell>
                          <div className="font-medium">{(entry.action || '').replace(/_/g, ' ')}</div>
                          <div className="text-sm text-muted-foreground">{entry.details}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.actor_name || entry.user_email || 'Unknown user'}</div>
                          <div className="mt-1 flex flex-col gap-1 text-xs text-muted-foreground">
                            {entry.machine_address ? <span>Machine {entry.machine_address}</span> : null}
                            <span>{entry.source || 'supabase'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDateTime(entry.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950">
              <span>Page {activityPage} of {Math.max(1, Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE))}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activityPage <= 1}
                  onClick={async () => {
                    const nextPage = Math.max(1, activityPage - 1);
                    setActivityPage(nextPage);
                    await loadActivity(nextPage);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activityPage >= Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE)}
                  onClick={async () => {
                    const nextPage = Math.min(Math.max(1, Math.ceil(activityTotal / ACTIVITY_PAGE_SIZE)), activityPage + 1);
                    setActivityPage(nextPage);
                    await loadActivity(nextPage);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Latest inventory</CardTitle>
                <CardDescription>Recent entries from the laptop inventory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!laptops || laptops.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inventory records available.</p>
                ) : (
                  laptops.map((laptop) => (
                    <div key={laptop.id} className="rounded-lg border p-3">
                      <p className="font-medium">{laptop.name}</p>
                      <p className="text-sm text-muted-foreground">Qty {laptop.quantity ?? 1} • {laptop.shop_name}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latest sales</CardTitle>
                <CardDescription>Most recent transactions captured in the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!sales || sales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sales recorded yet.</p>
                ) : (
                  sales.map((sale) => (
                    <div key={sale.id} className="rounded-lg border p-3">
                      <p className="font-medium">{sale.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{sale.phone} • Rs. {Number(sale.sale_price ?? 0).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
