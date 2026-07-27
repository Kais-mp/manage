'use client';

import { Fragment, useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { logAdminActivity } from '@/lib/admin-activity';
import { Laptop } from '@/types/laptop';
import { Sale } from '@/types/sale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { Laptop as LaptopIcon, Search, Store, BadgeDollarSign, ArrowUpDown, Plus, Trash2, CalendarDays, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const SHOPS = ['Mini Tech', 'T.M. Communication'] as const;

function formatShopName(shopName: string) {
  return shopName === 'T.M. Communication' || shopName === 'T.M.' ? 'T.M.' : shopName;
}

function formatPreviewDate(dateStr?: string) {
  if (!dateStr) return 'Unknown';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return 'Unknown';
  const day = d.getDate();
  const month = d.toLocaleString(undefined, { month: 'long' });
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
}

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  cost_price: z.coerce.number().min(0, { message: 'Cost price must be a positive number.' }),
  sale_price: z.coerce.number().min(0, { message: 'Sale price must be a positive number.' }),
  quantity: z.coerce.number().int().min(1, { message: 'Quantity must be at least 1.' }),
  specs: z.string().min(5, { message: 'Specs must be at least 5 characters.' }),
  shop_name: z.enum(SHOPS),
  date: z.string().min(10, { message: 'Date is required.' }),
  dealer_ids: z.array(z.string()).optional(),
});

const saleSchema = z.object({
  customer_name: z.string().min(2, { message: 'Customer name is required.' }),
  phone: z.string().trim().optional().refine((val) => !val || val.length >= 8, {
    message: 'Phone number must be at least 8 digits.',
  }),
  date: z.string().min(10, { message: 'Sale date is required.' }),
  shop: z.enum(SHOPS),
  sale_price: z.coerce.number().min(0, { message: 'Sale price must be a positive number.' }),
  remarks: z.string().max(250).optional(),
});

const batchSaleSchema = z.object({
  customer_name: z.string().min(2, { message: 'Customer name is required.' }),
  phone: z.string().trim().optional().refine((val) => !val || val.length >= 8, {
    message: 'Phone number must be at least 8 digits.',
  }),
  date: z.string().min(10, { message: 'Sale date is required.' }),
  shop: z.enum(SHOPS),
  remarks: z.string().max(250).optional(),
  items: z.array(z.object({
    laptop_id: z.string(),
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1, { message: 'At least one laptop must be selected.' })
});

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
}

function getLaptopDisplayPrice(laptop: Laptop) {
  return Number(laptop.sale_price ?? laptop.price ?? 0);
}

export function LaptopManagement() {
  const LAPTOPS_PER_PAGE = 50;
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [laptops, setLaptops] = useState<Laptop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShop, setFilterShop] = useState<string>('all');
  const [filterDealer, setFilterDealer] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'profit-asc' | 'profit-desc'>('newest');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLaptop, setSelectedLaptop] = useState<Laptop | null>(null);
  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null);
  const [dealers, setDealers] = useState<{id:string;name:string}[]>([]);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [saleLaptop, setSaleLaptop] = useState<Laptop | null>(null);
  const [isSaleSubmitting, setIsSaleSubmitting] = useState(false);
  const [isBatchSaleDialogOpen, setIsBatchSaleDialogOpen] = useState(false);
  const [isBatchSaleSubmitting, setIsBatchSaleSubmitting] = useState(false);
  const [batchSaleSearchTerm, setBatchSaleSearchTerm] = useState('');
  const [batchSaleAllLaptops, setBatchSaleAllLaptops] = useState<Laptop[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [saleLaptopMap, setSaleLaptopMap] = useState<Record<string, string>>({});
  const lastSaleSubmissionRef = useRef<{ key: string; time: number } | null>(null);
  const searchDebounceRef = useRef<number | null>(null);

  function openSaleDialog(laptop: Laptop) {
    setSaleLaptop(laptop);
    saleForm.reset({
      customer_name: '',
      phone: '',
      date: new Date().toISOString().slice(0, 10),
      shop: 'Mini Tech',
      sale_price: laptop.sale_price ?? laptop.price ?? 0,
      remarks: '',
    });
    setIsSaleDialogOpen(true);
  }

  function openEditDialog(laptop: Laptop) {
    setSelectedLaptop(null);
    setEditingLaptop(laptop);
    const selectedDealerIds = laptop.dealer_ids ?? [];
    form.reset({
      name: laptop.name,
      cost_price: laptop.cost_price ?? 0,
      sale_price: getLaptopDisplayPrice(laptop),
      quantity: laptop.quantity ?? 1,
      specs: laptop.specs,
      shop_name: laptop.shop_name,
      date: laptop.date ? laptop.date.slice(0,10) : laptop.created_at ? laptop.created_at.slice(0,10) : new Date().toISOString().slice(0,10),
      dealer_ids: selectedDealerIds,
    });
    setIsDialogOpen(true);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      cost_price: 0,
      sale_price: 0,
      quantity: 1,
      specs: '',
      shop_name: 'Mini Tech',
      date: new Date().toISOString().slice(0, 10),
      dealer_ids: [],
    },
  });

  const saleForm = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      customer_name: '',
      phone: '',
      date: new Date().toISOString().slice(0, 10),
      shop: 'Mini Tech',
      sale_price: 0,
      remarks: '',
    },
  });

  const batchSaleForm = useForm<z.infer<typeof batchSaleSchema>>({
    resolver: zodResolver(batchSaleSchema) as any,
    defaultValues: {
      customer_name: '',
      phone: '',
      date: new Date().toISOString().slice(0, 10),
      shop: 'Mini Tech',
      remarks: '',
      items: [],
    },
  });

  async function fetchLaptops(pageNumber = 1, q = '') {
    setLoading(true);
    const from = (pageNumber - 1) * LAPTOPS_PER_PAGE;
    const to = from + LAPTOPS_PER_PAGE - 1;

    try {
      let builder: any = supabase.from('laptops').select('*', { count: 'exact' });
      builder = builder.eq('is_sold', false).gt('quantity', 0);

      // search server-side across name and specs
      if (q && q.trim()) {
        const like = `%${q.trim()}%`;
        builder = builder.or(`name.ilike.${like},specs.ilike.${like}`);
      }

      // server-side shop filter
      if (filterShop && filterShop !== 'all') {
        builder = builder.eq('shop_name', filterShop);
      }

      // server-side dealer filter
      if (filterDealer && filterDealer !== 'all') {
        builder = builder.contains('dealer_ids', [filterDealer]);
      }


      // sorting
      if (sortBy === 'price-asc') builder = builder.order('price', { ascending: true });
      else if (sortBy === 'price-desc') builder = builder.order('price', { ascending: false });
      else builder = builder.order('created_at', { ascending: false });

      builder = builder.range(from, to);

      const { data, error, count } = await builder;

      if (error) {
        toast.error('Failed to fetch laptops');
        setLaptops([]);
        setTotalRows(0);
      } else {
        setLaptops(data || []);
        setTotalRows(count || 0);
      }
    } catch (err) {
      toast.error('An error occurred while fetching laptops');
    } finally {
      setLoading(false);
    }
  }

  async function fetchTotalQuantity() {
    try {
      const { data, error } = await supabase
        .from('laptops')
        .select('quantity')
        .eq('is_sold', false)
        .gt('quantity', 0);
      if (error) {
        setTotalQuantity(0);
        return;
      }
      const sum = (data || []).reduce((s: number, r: any) => s + (r.quantity ?? 0), 0);
      setTotalQuantity(sum);
    } catch (err) {
      setTotalQuantity(0);
    }
  }

  useEffect(() => {
    // initial and page changes
    fetchLaptops(page, searchTerm);
    fetchDealers();
    fetchSales();
    fetchTotalQuantity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // debounce search input
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    // @ts-ignore
    searchDebounceRef.current = window.setTimeout(() => {
      setPage(1);
      fetchLaptops(1, searchTerm);
    }, 300);
    return () => { if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterShop, filterDealer, maxPrice, sortBy]);

  async function fetchDealers() {
    const { data, error } = await supabase.from('dealers').select('id, name').order('created_at', { ascending: false });
    if (!error && data) {
      setDealers(data);
    }
  }

  async function fetchSales() {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);

    if (!error && data) {
      setSales(data);

      const laptopIds = Array.from(new Set(data.map((sale) => sale.laptop_id)));
      if (laptopIds.length > 0) {
        const { data: laptopData } = await supabase
          .from('laptops')
          .select('id, name')
          .in('id', laptopIds);

        if (laptopData) {
          const lookup: Record<string, string> = {};
          laptopData.forEach((laptop) => {
            lookup[laptop.id] = laptop.name;
          });
          setSaleLaptopMap(lookup);
        }
      }
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      let error = null;

      const payload = {
        name: values.name,
        cost_price: values.cost_price,
        sale_price: values.sale_price,
        price: values.sale_price,
        quantity: values.quantity,
        specs: values.specs,
        shop_name: values.shop_name,
        date: values.date,
        dealer_ids: values.dealer_ids ?? [],
        is_sold: false,
      };

      if (editingLaptop) {
        const { error: updateError } = await supabase.from('laptops').update(payload).eq('id', editingLaptop.id);
        error = updateError;
      } else {
        const slug = `${slugify(values.name)}-${Math.random().toString(36).substring(2, 7)}`;
        const { error: insertError } = await supabase.from('laptops').insert([{ ...payload, slug }]);
        error = insertError;
      }

      if (error) {
        toast.error(editingLaptop ? 'Error updating laptop: ' + error.message : 'Error adding laptop: ' + error.message);
      } else {
        await logAdminActivity(
          editingLaptop ? 'updated_laptop' : 'added_laptop',
          `${values.name} • ${values.shop_name} • Qty ${values.quantity}`,
        );
        toast.success(editingLaptop ? 'Laptop updated successfully!' : 'Laptop added successfully!');
        form.reset({
          name: '',
          cost_price: 0,
          sale_price: 0,
          quantity: 1,
          specs: '',
          shop_name: 'Mini Tech',
          dealer_ids: [],
        });
        setIsDialogOpen(false);
        setEditingLaptop(null);
        await fetchLaptops(page);
        fetchTotalQuantity();
      }
    } catch (err: any) {
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this laptop?')) return;

    const laptopToDelete = laptops.find((item) => item.id === id);
    const laptopName = laptopToDelete?.name ?? id;

    try {
      const { error } = await supabase.from('laptops').delete().eq('id', id);
      
      if (error) {
        toast.error('Error deleting laptop: ' + error.message);
        return;
      }

      await logAdminActivity('deleted_laptop', `Removed laptop ${laptopName}`);
      toast.success('Laptop deleted successfully');
      // refresh current page (clamp later if needed)
      await fetchLaptops(page);
      fetchTotalQuantity();
    } catch (err) {
      toast.error('An error occurred while deleting');
    }
  }

  const filteredLaptops = laptops
    .filter((laptop) => {
      const matchesShop = filterShop === 'all' || laptop.shop_name === filterShop;
      const matchesDealer = filterDealer === 'all' || (laptop.dealer_ids ?? []).includes(filterDealer);
      const quantity = laptop.quantity ?? 1;
      const isAvailable = !laptop.is_sold && quantity > 0;
      return matchesShop  && matchesDealer && isAvailable;
    })
    .sort((a, b) => {
      const priceA = getLaptopDisplayPrice(a);
      const priceB = getLaptopDisplayPrice(b);
      const profitA = priceA - (a.cost_price ?? 0);
      const profitB = priceB - (b.cost_price ?? 0);
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'profit-asc') return profitA - profitB;
      if (sortBy === 'profit-desc') return profitB - profitA;
      return 0;
    });

  const filteredQuantity = filteredLaptops.reduce((sum, laptop) => sum + (laptop.quantity ?? 1), 0);
  const inventoryValue = filteredLaptops.reduce((sum, laptop) => sum + getLaptopDisplayPrice(laptop), 0);
  const inventoryCost = filteredLaptops.reduce((sum, laptop) => sum + (laptop.cost_price ?? 0), 0);
  const potentialProfit = inventoryValue - inventoryCost;
  const averageMargin = inventoryCost > 0 ? (potentialProfit / inventoryCost) * 100 : 0;
  const topMarginLaptop = [...filteredLaptops].sort((a, b) => {
    const profitA = getLaptopDisplayPrice(a) - (a.cost_price ?? 0);
    const profitB = getLaptopDisplayPrice(b) - (b.cost_price ?? 0);
    return profitB - profitA;
  })[0];

  const totalPages = Math.max(1, Math.ceil((totalRows || 0) / LAPTOPS_PER_PAGE));

  useEffect(() => {
    if (isBatchSaleDialogOpen && batchSaleAllLaptops.length === 0) {
      supabase.from('laptops').select('*').eq('is_sold', false).gt('quantity', 0)
        .then(({ data }) => setBatchSaleAllLaptops(data || []));
    }
  }, [isBatchSaleDialogOpen, batchSaleAllLaptops.length]);


  return (
    <div className="space-y-8 overflow-x-hidden">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search laptops..."
              className="pl-10 h-12 text-lg shadow-sm border-zinc-200 dark:border-zinc-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            size="lg"
            variant="outline"
            className="h-12 px-6 gap-2 shrink-0 w-full md:w-auto border-primary text-primary hover:bg-primary/5 hover:text-black"
            onClick={() => {
              batchSaleForm.reset({
                customer_name: '',
                phone: '',
                date: new Date().toISOString().slice(0, 10),
                shop: 'Mini Tech',
                remarks: '',
                items: [],
              });
              setIsBatchSaleDialogOpen(true);
            }}
          >
            <Store className="h-5 w-5" />
            Batch Sale
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-12 px-6 gap-2 shrink-0 w-full md:w-auto"
                onClick={() => {
                  setEditingLaptop(null);
                  form.reset({
                    name: '',
                    cost_price: 0,
                    sale_price: 0,
                    quantity: 1,
                    specs: '',
                    shop_name: 'Mini Tech',
                    dealer_ids: [],
                  });
                }}
              >
                <Plus className="h-5 w-5" />
                Add Laptop
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0">
              <div className="p-4 sm:p-6">
                <DialogHeader className="px-1">
                  <DialogTitle className="text-xl">{editingLaptop ? 'Edit Laptop' : 'Add New Laptop'}</DialogTitle>
                  <DialogDescription>
                    {editingLaptop ? 'Update the laptop details.' : 'Enter the laptop details to add it to your inventory.'}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4 pt-3">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Laptop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. MacBook Pro M3" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price (PKR)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sale_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Price (PKR)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shop_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Name</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select a shop" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Mini Tech">Mini Tech</SelectItem>
                              <SelectItem value="T.M. Communication">T.M.</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input type="date" {...field} />
                              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dealer_ids"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dealers</FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                  <span className="truncate">
                                    {(field.value && field.value.length > 0)
                                      ? dealers.filter((d) => field.value?.includes(d.id)).map((d) => d.name).join(', ')
                                      : 'Select dealers'}
                                  </span>
                                  <span className="text-muted-foreground text-xs">▾</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[240px]">
                                {dealers.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">No dealers available</div>
                                ) : (
                                  dealers.map((dealer) => (
                                    <DropdownMenuCheckboxItem
                                      key={dealer.id}
                                      checked={field.value?.includes(dealer.id) ?? false}
                                      onCheckedChange={(checked) => {
                                        const current = field.value ?? [];
                                        const next = checked
                                          ? [...current, dealer.id]
                                          : current.filter((id) => id !== dealer.id);
                                        field.onChange(next);
                                      }}
                                    >
                                      {dealer.name}
                                    </DropdownMenuCheckboxItem>
                                  ))
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="specs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g. 16GB RAM, 512GB SSD, M3 Chip" 
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <Button type="submit" className="w-full h-11 rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving laptop…' : 'Save Laptop'}
                    </Button>
                  </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button 
            variant={filterShop === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterShop('all')}
            className="rounded-full"
          >
            All Shops
          </Button>
          <Button 
            variant={filterShop === 'Mini Tech' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterShop('Mini Tech')}
            className="rounded-full gap-2"
          >
            <Store className="h-3.5 w-3.5" />
            Mini Tech
          </Button>
          <Button 
            variant={filterShop === 'T.M. Communication' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilterShop('T.M. Communication')}
            className="rounded-full gap-2"
          >
            <Store className="h-3.5 w-3.5" />
            T.M.
          </Button>

          <Select value={filterDealer} onValueChange={setFilterDealer}>
            <SelectTrigger className="h-9 w-[180px] rounded-full">
              <BadgeDollarSign className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="All dealers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dealers</SelectItem>
              {dealers.map((dealer) => (
                <SelectItem key={dealer.id} value={dealer.id}>{dealer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="ml-auto flex items-center gap-2">
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="h-9 w-[150px] rounded-full">
                <ArrowUpDown className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="profit-asc">Profit: Low to High</SelectItem>
                <SelectItem value="profit-desc">Profit: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>



      <Dialog open={isBatchSaleDialogOpen} onOpenChange={setIsBatchSaleDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add Batch Sale</DialogTitle>
              <DialogDescription>Record a single sale containing multiple laptops.</DialogDescription>
            </DialogHeader>
            <Form {...batchSaleForm}>
              <form onSubmit={batchSaleForm.handleSubmit(async (values) => {
                if (isBatchSaleSubmitting) return;
                setIsBatchSaleSubmitting(true);
                try {
                  const normalizedPhone = values.phone?.trim();
                  const actionKey = `batch-${values.customer_name}-${normalizedPhone}-${values.date}-${values.items.map(i => i.laptop_id).join('-')}`;
                  if (lastSaleSubmissionRef.current?.key === actionKey && Date.now() - lastSaleSubmissionRef.current.time < 2000) {
                    toast.error('This sale was already submitted.');
                    setIsBatchSaleSubmitting(false);
                    return;
                  }

                  // Calculate total sale price from items
                  const totalSalePrice = values.items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

                  // 1. Insert sale record
                  const { data: insertedSale, error: saleError } = await supabase.from('batch_sales').insert([{
                    customer_name: values.customer_name,
                    phone: normalizedPhone || null,
                    date: values.date,
                    shop: values.shop,
                    remarks: values.remarks,
                    items: values.items,
                    sale_price: totalSalePrice
                  }]).select().single();
                  
                  if (saleError) {
                    toast.error('Could not save batch sale');
                    setIsBatchSaleSubmitting(false);
                    return;
                  }

                  lastSaleSubmissionRef.current = { key: actionKey, time: Date.now() };

                  // 2. Update laptop quantities
                  const updates = values.items.map(item => {
                    const laptop = laptops.find(l => l.id === item.laptop_id);
                    const before = laptop?.quantity ?? 1;
                    const after = Math.max(0, before - item.quantity);
                    return supabase.from('laptops').update({
                      quantity: after,
                      is_sold: after <= 0,
                      sold_at: after <= 0 ? new Date().toISOString() : null,
                    }).eq('id', item.laptop_id);
                  });

                  await Promise.all(updates);

                  await logAdminActivity(
                    'added_batch_sale',
                    `${values.customer_name} • ${values.items.reduce((s, i) => s + i.quantity, 0)} items • ${values.date}`,
                  );
                  toast.success('Batch sale recorded and inventory updated');
                  setIsBatchSaleDialogOpen(false);
                  fetchLaptops(page, searchTerm);
                  fetchSales();
                } catch (err) {
                  toast.error('An error occurred while saving the batch sale.');
                } finally {
                  setIsBatchSaleSubmitting(false);
                }
              })} className="space-y-4 pt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField control={batchSaleForm.control} name="customer_name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={batchSaleForm.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Customer phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={batchSaleForm.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={batchSaleForm.control} name="shop" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shop</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shop" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mini Tech">Mini Tech</SelectItem>
                          <SelectItem value="T.M. Communication">T.M.</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={batchSaleForm.control} name="remarks" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optional remarks" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="mt-6 border-t pt-4">
                  <FormLabel className="text-base font-semibold mb-2 block">Laptops in Sale</FormLabel>
                  <FormField control={batchSaleForm.control} name="items" render={({ field }) => (
                    <FormItem>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between h-auto py-3">
                            <span className="truncate">Add laptops to this sale</span>
                            <Plus className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[300px] sm:w-[400px] max-h-[400px] overflow-y-auto">
                          <div className="p-2 pb-1 sticky top-0 bg-popover z-10">
                            <Input
                              placeholder="Search laptops..."
                              value={batchSaleSearchTerm}
                              onChange={(e) => setBatchSaleSearchTerm(e.target.value)}
                              onKeyDown={(e) => e.stopPropagation()}
                              className="h-9"
                            />
                          </div>
                          {batchSaleAllLaptops.filter(l => 
                            !batchSaleSearchTerm || 
                            l.name.toLowerCase().includes(batchSaleSearchTerm.toLowerCase()) || 
                            (l.specs && l.specs.toLowerCase().includes(batchSaleSearchTerm.toLowerCase()))
                          ).map((laptop) => {
                            const isSelected = field.value.some(i => i.laptop_id === laptop.id);
                            return (
                              <DropdownMenuCheckboxItem
                                key={laptop.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  const current = field.value;
                                  if (checked) {
                                    field.onChange([...current, {
                                      laptop_id: laptop.id,
                                      quantity: 1,
                                      unit_price: laptop.sale_price ?? laptop.price ?? 0
                                    }]);
                                  } else {
                                    field.onChange(current.filter(i => i.laptop_id !== laptop.id));
                                  }
                                }}
                              >
                                <div className="flex flex-col w-full pr-4 gap-1 py-1">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium">{laptop.name}</span>
                                    <span className="text-muted-foreground text-xs ml-2 whitespace-nowrap">Qty: {laptop.quantity ?? 1}</span>
                                  </div>
                                  {laptop.specs && (
                                    <span className="text-muted-foreground text-[10px] line-clamp-1 max-w-[250px] sm:max-w-[320px]" title={laptop.specs}>
                                      {laptop.specs}
                                    </span>
                                  )}
                                </div>
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {batchSaleForm.watch('items').length > 0 && (
                    <div className="mt-4 space-y-3">
                      {batchSaleForm.watch('items').map((item, index) => {
                        const laptop = batchSaleAllLaptops.find(l => l.id === item.laptop_id) || laptops.find(l => l.id === item.laptop_id);
                        if (!laptop) return null;
                        const maxQty = laptop.quantity ?? 1;
                        return (
                          <div key={item.laptop_id} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center bg-slate-50 dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-800">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{laptop.name}</p>
                              <p className="text-xs text-muted-foreground">Avail: {maxQty}</p>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground whitespace-nowrap">Qty:</label>
                                <Input 
                                  type="number" 
                                  min={1} 
                                  max={maxQty} 
                                  value={item.quantity}
                                  className="w-16 h-8 text-sm"
                                  onChange={(e) => {
                                    const val = Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1));
                                    const next = [...batchSaleForm.getValues('items')];
                                    next[index] = { ...next[index], quantity: val };
                                    batchSaleForm.setValue('items', next, { shouldValidate: true });
                                  }}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground whitespace-nowrap">Price:</label>
                                <Input 
                                  type="number" 
                                  min={0}
                                  value={item.unit_price}
                                  className="w-24 h-8 text-sm"
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0);
                                    const next = [...batchSaleForm.getValues('items')];
                                    next[index] = { ...next[index], unit_price: val };
                                    batchSaleForm.setValue('items', next, { shouldValidate: true });
                                  }}
                                />
                              </div>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => {
                                  const next = batchSaleForm.watch('items').filter((_, i) => i !== index);
                                  batchSaleForm.setValue('items', next, { shouldValidate: true });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center py-2 px-1 text-sm font-semibold border-t border-slate-200 dark:border-zinc-800 mt-2">
                        <span>Total amount:</span>
                        <span className="text-primary text-base">
                          Rs. {batchSaleForm.watch('items').reduce((s, i) => s + (i.quantity * i.unit_price), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-slate-200/70 dark:border-zinc-800">
                  <Button type="button" variant="outline" onClick={() => setIsBatchSaleDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-full" disabled={isBatchSaleSubmitting}>
                    {isBatchSaleSubmitting ? 'Saving…' : 'Complete Batch Sale'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add sale</DialogTitle>
              <DialogDescription>Record a new sale for this laptop.</DialogDescription>
            </DialogHeader>
            {saleLaptop && (
              <div className="px-6 pb-2">
                <p className="text-sm text-muted-foreground">For laptop</p>
                <p className="text-base font-semibold text-foreground">{saleLaptop.name}</p>
              </div>
            )}
              <Form {...saleForm}>
              <form onSubmit={saleForm.handleSubmit(async (values) => {
                if (!saleLaptop) {
                  toast.error('No laptop selected for this sale');
                  return;
                }
                if (isSaleSubmitting) return;
                const actionKey = `${saleLaptop.id}-${values.customer_name}-${values.phone}-${values.date}-${values.remarks || ''}-${saleLaptop.sale_price ?? saleLaptop.price ?? 0}`;
                if (lastSaleSubmissionRef.current?.key === actionKey && Date.now() - lastSaleSubmissionRef.current.time < 2000) {
                  toast.error('This sale was already submitted.');
                  return;
                }
                setIsSaleSubmitting(true);

                try {
                  // Prevent accidental duplicate sales: check if a sale with same laptop, phone and date already exists
                  const normalizedPhone = values.phone?.trim();
                  let duplicateQuery: any = supabase
                    .from('sales')
                    .select('id')
                    .eq('laptop_id', saleLaptop.id)
                    .eq('date', values.date);
                  if (normalizedPhone) {
                    duplicateQuery = duplicateQuery.eq('phone', normalizedPhone);
                  } else {
                    duplicateQuery = duplicateQuery.eq('customer_name', values.customer_name);
                  }
                  const { data: existing, error: fetchErr } = await duplicateQuery.limit(1);

                  if (fetchErr) {
                    toast.error('Could not verify existing sales');
                    setIsSaleSubmitting(false);
                    return;
                  }

                  if (existing && existing.length > 0) {
                    toast.error('This sale appears to have already been recorded (duplicate detected).');
                    setIsSaleSubmitting(false);
                    return;
                  }

                  const quantityBefore = saleLaptop.quantity ?? 1;
                  const quantityAfter = Math.max(0, quantityBefore - 1);

                  const { error: saleError } = await supabase.from('sales').insert([{
                    laptop_id: saleLaptop.id,
                    customer_name: values.customer_name,
                    phone: normalizedPhone || null,
                    date: values.date,
                    shop: values.shop,
                    remarks: values.remarks,
                    sale_price: saleLaptop.sale_price ?? saleLaptop.price ?? 0,
                  }]);
                  if (saleError) {
                    toast.error('Could not save sale');
                    setIsSaleSubmitting(false);
                    return;
                  }

                  lastSaleSubmissionRef.current = {
                    key: actionKey,
                    time: Date.now(),
                  };

                  const { error: updateError } = await supabase.from('laptops').update({
                    quantity: quantityAfter,
                    is_sold: quantityAfter <= 0,
                    sold_at: quantityAfter <= 0 ? new Date().toISOString() : null,
                  }).eq('id', saleLaptop.id);

                  if (updateError) {
                    toast.error('Sale recorded but the laptop could not be updated');
                    setIsSaleSubmitting(false);
                    return;
                  }

                  await logAdminActivity(
                    'added_sale',
                    `${values.customer_name} • ${saleLaptop.name} • ${values.date}`,
                  );
                  toast.success('Sale recorded and inventory updated');
                  saleForm.reset({
                    customer_name: '',
                    phone: '',
                    date: new Date().toISOString().slice(0, 10),
                    shop: 'Mini Tech',
                    sale_price: 0,
                    remarks: '',
                  });
                  setIsSaleDialogOpen(false);
                  fetchLaptops(page, searchTerm);
                  fetchSales();
                } finally {
                  setIsSaleSubmitting(false);
                }
              })} className="space-y-4 pt-4">
                <FormField control={saleForm.control} name="customer_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Customer name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={saleForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Customer phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={saleForm.control} name="sale_price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale price</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={1} {...field} placeholder="Sale price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={saleForm.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="date" {...field} />
                        <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={saleForm.control} name="shop" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mini Tech">Mini Tech</SelectItem>
                        <SelectItem value="T.M. Communication">T.M. Communication</SelectItem>
                      </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={saleForm.control} name="remarks" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optional notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/70 dark:border-zinc-800">
                  <Button variant="outline" onClick={() => setIsSaleDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" className="rounded-full" disabled={isSaleSubmitting}>{isSaleSubmitting ? 'Saving…' : 'Save sale'}</Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LaptopIcon className="h-5 w-5 text-primary" />
              Inventory
            </h2>
            <p className="text-sm text-muted-foreground">{totalQuantity} laptops tracked across your stores</p>
          </div>
          <div className="rounded-full border bg-background/80 px-3 py-1 text-sm text-muted-foreground shadow-sm">
            {filteredLaptops.reduce((sum, laptop) => sum + (laptop.quantity ?? 1), 0)} visible
          </div>
        </div>

        {loading ? (
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[220px]">Laptop</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Sale</TableHead>
                  <TableHead>Specifications</TableHead>
                  <TableHead>Shop</TableHead>
                  <TableHead className="w-[72px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-36 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-52 animate-pulse rounded bg-muted" /></TableCell>
                    <TableCell><div className="h-4 w-6 animate-pulse rounded bg-muted" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : filteredLaptops.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 py-16 text-center text-muted-foreground">
            <Search className="mx-auto mb-4 h-10 w-10 opacity-20" />
            <p className="text-lg font-medium text-foreground">No laptops found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Laptop</TableHead>
                      <TableHead className="min-w-[180px] max-w-[200px]">Specifications</TableHead>
                      <TableHead className="w-[56px] text-right">Qty</TableHead>
                      <TableHead className="w-[92px] text-right">Cost</TableHead>
                      <TableHead className="w-[92px] text-right">Sale</TableHead>
                      <TableHead className="w-[80px]">Shop</TableHead>
                      <TableHead className="w-[72px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLaptops.map((laptop) => {
                      const isSelected = selectedLaptop?.id === laptop.id;
                      return (
                        <Fragment key={laptop.id}>
                          <TableRow className="align-top hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedLaptop((current) => current?.id === laptop.id ? null : laptop)}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="min-w-0">
                                  <Link href={`/laptops/${laptop.slug}`} className="block truncate font-semibold text-foreground transition-colors hover:text-primary">
                                    {laptop.name}
                                  </Link>
                                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    {laptop.dealer_ids && laptop.dealer_ids.length > 0
                                      ? laptop.dealer_ids.map((id) => dealers.find((d) => d.id === id)?.name || id).join(', ')
                                      : '—'
                                    }
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-sm text-muted-foreground line-clamp-2">{laptop.specs}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-foreground">{laptop.quantity ?? 1}</span>
                            </TableCell>
                            <TableCell className="text-right truncate">
                              <span className="font-semibold text-foreground block truncate">{(laptop.cost_price ?? 0).toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right truncate">
                              <span className="font-semibold text-primary block truncate">{(laptop.sale_price ?? laptop.price ?? 0).toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-foreground">
                                  {formatShopName(laptop.shop_name)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-y-2">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openSaleDialog(laptop);
                                  }}
                                >
                                  Sale
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDialog(laptop);
                                  }}
                                >
                                  Edit
                                </Button>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(laptop.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                          {isSelected && selectedLaptop && (
                            <TableRow className="bg-slate-50 dark:bg-zinc-900">
                              <TableCell colSpan={7} className="p-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                  <div className="space-y-3">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Laptop name</p>
                                      <p className="mt-1 text-base font-semibold text-foreground">{selectedLaptop.name}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Shop</p>
                                      <p className="mt-1 text-sm text-foreground">{formatShopName(selectedLaptop.shop_name)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Cost price</p>
                                      <p className="mt-1 text-sm font-semibold text-primary">Rs. {(selectedLaptop.cost_price ?? 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Sale price</p>
                                      <p className="mt-1 text-sm font-semibold text-primary">Rs. {(selectedLaptop.sale_price ?? selectedLaptop.price ?? 0).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Specifications</p>
                                      <div className="mt-2 rounded-2xl border border-muted p-3 bg-muted/5 text-sm leading-snug text-foreground whitespace-pre-line max-h-36 overflow-auto">
                                        {selectedLaptop.specs}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Dealers</p>
                                      <p className="mt-2 text-sm text-foreground">
                                        {selectedLaptop.dealer_ids && selectedLaptop.dealer_ids.length > 0
                                          ? selectedLaptop.dealer_ids.map((id) => dealers.find((d) => d.id === id)?.name || id).join(', ')
                                          : '—'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground">Date</p>
                                      <p className="mt-2 text-sm text-foreground">{formatPreviewDate(selectedLaptop.date ?? selectedLaptop.created_at)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start justify-end">
                                    <Button variant="outline" size="sm" onClick={() => setSelectedLaptop(null)}>
                                      Close preview
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 rounded-b-2xl border border-t-0 border-slate-200/70 bg-background px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div>{filteredQuantity} laptops visible based on current filters</div>
              <div className="flex items-center gap-2">
                <div>Page {page} of {totalPages}</div>
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          </>
        )}
      {/* Laptops table moved above, now show sales below */}
      <section className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Sales</h2>
            <p className="text-sm text-muted-foreground">Recent sales for all laptops.</p>
          </div>
          <div>
            <Link href="/sales">
              <Button variant="outline" size="sm">See all sales</Button>
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Laptop</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No sales have been recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => {
                  const laptop = sale.laptop_id ? laptops.find((item) => item.id === sale.laptop_id) : undefined;
                  const laptopName = sale.laptop_id ? saleLaptopMap[sale.laptop_id] ?? laptop?.name : undefined;
                  return (
                    <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>{sale.customer_name}</TableCell>
                      <TableCell>{sale.phone}</TableCell>
                      <TableCell>{laptopName ?? sale.laptop_id ?? 'Unknown laptop'}</TableCell>
                      <TableCell>{sale.date}</TableCell>
                      <TableCell className="max-w-[320px] truncate text-muted-foreground">{sale.remarks || '—'}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
      </div>
    </div>
  );
}
