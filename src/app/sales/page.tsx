"use client";

import { Fragment, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { logAdminActivity } from '@/lib/admin-activity';
import { Navbar } from '@/components/navbar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';
import { Sale } from '@/types/sale';
import { Laptop as LaptopType } from '@/types/laptop';
import { toast } from 'sonner';
import { Edit, Trash2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
    lastAutoTable: any;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = reject;

    img.src = src;
  });
}

const PER_PAGE = 100;

async function generateSaleInvoice({
  sale,
  laptops,
  shopName,
}: {
  sale: Sale;
  laptops?: LaptopType[] | null;
  shopName?: string;
}) {
  try {
    const template = await loadImage(
      '/invoices/tm-template.png'
    );

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;

    const invoiceX = 5;
const invoiceWidth = 200;

// Gradient side margins
for (let i = 0; i < pageHeight; i += 1) {
  const ratio = i / pageHeight;

  let r: number;
  let g: number;
  let b: number;

  if (ratio < 0.5) {
    const t = ratio * 2;

    r = Math.round(255 - t * 35);
    g = Math.round(255 - t * 20);
    b = Math.round(255 - t * 5);
  } else {
    const t = (ratio - 0.5) * 2;

    r = Math.round(220 - t * 90);
    g = Math.round(235 - t * 120);
    b = Math.round(250 - t * 70);
  }

  doc.setDrawColor(r, g, b);

  // Left margin
  doc.line(0, i, invoiceX, i);

  // Right margin
  doc.line(
    invoiceX + invoiceWidth,
    i,
    pageWidth,
    i
  );
}

// Invoice image
doc.addImage(
  template,
  'PNG',
  invoiceX,
  0,
  invoiceWidth,
  pageHeight
);

// Receipt perforation effect
doc.setFillColor(255, 255, 255);

const radius = 2;
const spacing = 6;

for (
  let perforationY = 3;
  perforationY < pageHeight;
  perforationY += spacing
) {
  doc.circle(
    invoiceX,
    perforationY,
    radius,
    'F'
  );

  doc.circle(
    invoiceX + invoiceWidth,
    perforationY,
    radius,
    'F'
  );
}

    const totalAmount = (sale.items && sale.items.length > 0)
      ? sale.items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0)
      : Number(sale.sale_price ?? 0);

    const dateStr = sale.date
      ? new Date(sale.date).toLocaleDateString(
          'en-GB'
        )
      : new Date().toLocaleDateString(
          'en-GB'
        );

    // ===================
    // HEADER DATA
    // ===================

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0);

    const invoiceNo =
      sale.id
        ?.replace(/-/g, '')
        ?.substring(0, 4)
        ?.toUpperCase() || '0001';

doc.setFont('helvetica', 'bold');

doc.setFontSize(14);
doc.text(invoiceNo, 30, 46);

doc.setFontSize(13);
doc.text(dateStr, 175, 47);

doc.setFontSize(13);
doc.text(sale.customer_name || '', 28, 56);

doc.setFontSize(12);
doc.text(sale.phone || '', 160, 56);

    doc.text(
      sale.phone || '',
      160,
      56
    );

    // ===================
    // ITEM ROW
    // ===================

    let rowIndex = 0;

    const itemsToPrint = (sale.items && sale.items.length > 0) 
      ? sale.items 
      : [{ laptop_id: sale.laptop_id, quantity: 1, unit_price: Number(sale.sale_price ?? 0) }];

    itemsToPrint.forEach((item, index) => {
      if (rowIndex > 10) return; // Prevent writing past the last available row on the template

      const currentLaptop = laptops?.find(l => l.id === item.laptop_id) || (laptops && laptops.length === 1 ? laptops[0] : null);
      const itemAmount = item.quantity * (item.unit_price || 0);

      const currentY = 88 + rowIndex * 12;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(String(index + 1), 16, currentY + 2, { align: 'center' }); // Centered Sr No

      const laptopName = currentLaptop?.name || 'Laptop';
      
      const hasSpecs = !!currentLaptop?.specs;
      // Moving name down so it does not cross the top boundary line of the row box
      const nameY = hasSpecs ? currentY + 1.5 : currentY + 2;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14); // Even larger laptop name
      doc.text(laptopName, 28, nameY);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(item.quantity).padStart(2, '0'), 113, currentY + 2, { align: 'center' }); // Centered Qty, shifted left
      doc.text(Number(item.unit_price || 0).toLocaleString(), 148, currentY + 2, { align: 'center' }); // Centered Unit Price
      doc.text(itemAmount.toLocaleString(), 193, currentY + 2, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9); // Specs font size

      if (hasSpecs) {
        const lines = doc.splitTextToSize(currentLaptop!.specs, 80);
        if (lines.length > 0) {
          doc.text(lines[0], 28, currentY + 6.5); // Settle on the row bottom boundary line
        }
      }
      rowIndex++; // Move down for the next item
    });

    // ===================
    // TOTAL BOX
    // ===================

    doc.setFont(
      'helvetica',
      'bold'
    );

    doc.setFontSize(12);

    doc.text(
      totalAmount.toLocaleString(),
      193,
      221,
      {
        align: 'right',
      }
    );


    // ===================
    // OPEN PDF
    // ===================

    const blob =
      doc.output('blob');

    const url =
      URL.createObjectURL(blob);

    window.open(
      url,
      '_blank'
    );
  } catch (error) {
    console.error(error);
    toast.error(
      'Failed to generate invoice'
    );
  }
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [laptopsMap, setLaptopsMap] = useState<Record<string, string>>({});
  const [laptopsShopMap, setLaptopsShopMap] = useState<Record<string, string>>({});
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [selectedSaleLaptops, setSelectedSaleLaptops] = useState<LaptopType[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isEditingSale, setIsEditingSale] = useState(false);
  const [editForm, setEditForm] = useState({ customer_name: '', phone: '', date: '', shop: 'Mini Tech', sale_price: 0, remarks: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const lastSaleSubmissionRef = useRef<{ key: string; time: number } | null>(null);

  useEffect(() => {
    fetchSales(page, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // debounce search
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // @ts-ignore
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      fetchSales(1, query);
    }, 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function fetchSales(p: number, q: string) {
    setLoading(true);
    const from = (p - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    try {
      let salesQuery = supabase
        .from('sales')
        .select('id,customer_name,phone,date,shop,remarks,laptop_id,sale_price,created_at');
        
      let batchSalesQuery = supabase
        .from('batch_sales')
        .select('id,customer_name,phone,date,shop,remarks,sale_price,items,created_at');

      if (q && q.trim()) {
        const like = `%${q.trim()}%`;
        const { data: laptopsData } = await supabase.from('laptops').select('id').or(`name.ilike.${like}`);
        const matchingLaptopIds = Array.from(new Set((laptopsData || []).map((l: any) => l.id)));

        const filters = [`customer_name.ilike.${like}`, `phone.ilike.${like}`];
        if (matchingLaptopIds.length > 0) {
          filters.push(`laptop_id.in.(${matchingLaptopIds.join(',')})`);
        }

        salesQuery = salesQuery.or(filters.join(','));
        // batch_sales doesn't have laptop_id column
        batchSalesQuery = batchSalesQuery.or(`customer_name.ilike.${like},phone.ilike.${like}`);
      }

      const [salesRes, batchSalesRes] = await Promise.all([salesQuery, batchSalesQuery]);

      if (salesRes.error || batchSalesRes.error) {
        toast.error('Failed to fetch sales');
        setSales([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      const rawSales = (salesRes.data || []).map(s => ({ ...s, sale_type: 'single' as const }));
      const rawBatchSales = (batchSalesRes.data || []).map(s => ({ ...s, sale_type: 'batch' as const }));
      
      const combined = [...rawSales, ...rawBatchSales].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;
        
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createdB - createdA;
      });

      setTotal(combined.length);
      
      const paginatedData = combined.slice(from, to + 1);
      setSales(paginatedData);

      // fetch laptop names and shops for visible sales
      const laptopIds = Array.from(new Set(paginatedData.flatMap((s: any) => {
        const ids = [];
        if (s.laptop_id) ids.push(s.laptop_id);
        if (s.items) s.items.forEach((i: any) => ids.push(i.laptop_id));
        return ids;
      }).filter(Boolean)));
      if (laptopIds.length > 0) {
        const { data: laptopsData } = await supabase.from('laptops').select('id,name,shop_name').in('id', laptopIds);
        const nameMap: Record<string, string> = {};
        const shopMap: Record<string, string> = {};
        (laptopsData || []).forEach((l: any) => {
          nameMap[l.id] = l.name;
          shopMap[l.id] = l.shop_name;
        });
        setLaptopsMap((prev) => ({ ...prev, ...nameMap }));
        setLaptopsShopMap((prev) => ({ ...prev, ...shopMap }));
      }
    } catch (err) {
      toast.error('An error occurred while fetching sales');
    } finally {
      setLoading(false);
    }
  }

  async function openSalePreview(sale: Sale) {
    if (selectedSale?.id === sale.id) {
      setSelectedSale(null);
      setSelectedSaleLaptops([]);
      return;
    }

    setSelectedSale(sale);
    setPreviewLoading(true);
    setSelectedSaleLaptops([]);

    const laptopIds = sale.items?.map(i => i.laptop_id) || [];
    if (sale.laptop_id) laptopIds.push(sale.laptop_id);

    if (laptopIds.length > 0) {
      const { data, error } = await supabase.from('laptops').select('*').in('id', laptopIds);
      if (error) {
        toast.error('Could not load laptop details for preview');
      } else if (data) {
        setSelectedSaleLaptops(data);
      }
    }

    setPreviewLoading(false);
  }

  function openEditSale(sale: Sale) {
    setEditingSale(sale);
    setEditForm({
      customer_name: sale.customer_name || '',
      phone: sale.phone || '',
      date: sale.date || '',
      shop: sale.shop || 'Mini Tech',
      sale_price: sale.sale_price ?? 0,
      remarks: sale.remarks || '',
    });
    setIsEditingSale(true);
  }

  async function handleDeleteSale(sale: Sale) {
    if (!window.confirm('Delete this sale record?')) return;
    const isBatch = sale.sale_type === 'batch';
    const table = isBatch ? 'batch_sales' : 'sales';
    const { error } = await supabase.from(table).delete().eq('id', sale.id);
    if (error) {
      toast.error('Could not delete sale');
      return;
    }
    await logAdminActivity(
      isBatch ? 'deleted_batch_sale' : 'deleted_sale',
      `Deleted ${isBatch ? 'batch sale' : 'sale'} for ${sale.customer_name || 'Customer'}`
    );
    toast.success('Sale deleted');
    if (selectedSale?.id === sale.id) {
      setSelectedSale(null);
      setSelectedSaleLaptops([]);
    }
    fetchSales(page, query);
  }

  async function handleEditSale() {
    if (!editingSale) return;
    setEditSubmitting(true);
    try {
      const actionKey = `${editingSale.id}-${editForm.customer_name}-${editForm.phone}-${editForm.date}-${editForm.shop}-${editForm.sale_price}-${editForm.remarks}`;
      if (lastSaleSubmissionRef.current?.key === actionKey) {
        toast.error('This update was already submitted.');
        return;
      }
      const isBatch = editingSale.sale_type === 'batch';
      const table = isBatch ? 'batch_sales' : 'sales';
      const { error } = await supabase
        .from(table)
        .update({
          customer_name: editForm.customer_name,
          phone: editForm.phone,
          date: editForm.date,
          shop: editForm.shop,
          sale_price: editForm.sale_price,
          remarks: editForm.remarks || null,
        })
        .eq('id', editingSale.id);
      if (error) {
        toast.error('Could not update sale');
        return;
      }
      lastSaleSubmissionRef.current = { key: actionKey, time: Date.now() };
      await logAdminActivity(
        isBatch ? 'updated_batch_sale' : 'updated_sale',
        `Updated ${isBatch ? 'batch sale' : 'sale'} for ${editForm.customer_name}`
      );
      toast.success('Sale updated');
      setIsEditingSale(false);
      setEditingSale(null);
      fetchSales(page, query);
    } finally {
      setEditSubmitting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / PER_PAGE));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans px-4 py-6 md:px-6 md:py-8">
      <div className="max-w-5xl mx-auto mb-10">
        <Navbar />
      </div>

      <main className="max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">All Sales</h1>
            <p className="text-sm text-muted-foreground">Browse all sales.</p>
          </div>
<div className="flex items-center gap-3 w-full">
  <Input
    className="flex-1"
    placeholder="Search by customer, phone, or laptop"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
  />

  <Link href="/inventory">
    <Button variant="outline">Back</Button>
  </Link>
</div>
        </div>

        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Sale price</TableHead>
                    <TableHead>Laptop</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Shop</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No sales found.</TableCell>
                    </TableRow>
                  ) : (
                    sales.map((s) => {
                      const hasItems = s.items && s.items.length > 0;
                      const totalSalePrice = hasItems ? s.items!.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0) : (s.sale_price ?? 0);
                      const totalQty = hasItems ? s.items!.reduce((acc, i) => acc + i.quantity, 0) : 1;
                      const laptopName = hasItems 
                        ? (totalQty === 1 && s.items!.length === 1 
                            ? (laptopsMap[String(s.items![0].laptop_id)] || s.items![0].laptop_id) 
                            : `${totalQty} laptops`) 
                        : (s.laptop_id ? (laptopsMap[String(s.laptop_id)] || s.laptop_id) : '—');
                      const shopName = s.shop || (s.laptop_id ? (laptopsShopMap[String(s.laptop_id)] || '—') : '—');
                      const isActive = selectedSale?.id === s.id;
                      return (
                        <Fragment key={s.id}>
                          <TableRow
                            className="border-t border-slate-200/80 transition-colors hover:bg-slate-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                          >
                            <TableCell className="font-medium cursor-pointer" onClick={() => openSalePreview(s)}>{s.customer_name}</TableCell>
                            <TableCell className="cursor-pointer" onClick={() => openSalePreview(s)}>Rs. {totalSalePrice.toLocaleString()}</TableCell>
                            <TableCell className="cursor-pointer" onClick={() => openSalePreview(s)}>{laptopName}</TableCell>
                            <TableCell className="cursor-pointer" onClick={() => openSalePreview(s)}>{s.date}</TableCell>
                            <TableCell className="max-w-xs truncate text-muted-foreground cursor-pointer" onClick={() => openSalePreview(s)}>{s.remarks || '—'}</TableCell>
                            <TableCell className="cursor-pointer" onClick={() => openSalePreview(s)}>{shopName}</TableCell>
                          </TableRow>
                          {isActive && (
                            <TableRow className="bg-slate-50 dark:bg-zinc-900">
                              <TableCell colSpan={6} className="p-4">
                                <div className="mb-2 flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-slate-50 p-2 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Sale preview</p>
                                  </div>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        generateSaleInvoice({
                                          sale: s,
                                          laptops: selectedSaleLaptops,
                                          shopName: shopName,
                                        });
                                      }}
                                    >
                                      <FileText className="mr-2 h-4 w-4" />
                                      Invoice
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditSale(s);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="rounded-full"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSale(s);
                                      }}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Customer</p>
                                      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{s.customer_name}</p>
                                    </div>
                                    <div className="mt-3">
                                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phone</p>
                                      <p className="mt-1 font-semibold text-slate-950 dark:text-white">{s.phone}</p>
                                    </div>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Date</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{s.date}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sale price</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">Rs. {totalSalePrice.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                                    <div>
                                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Remarks</p>
                                      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">{s.remarks || '—'}</p>
                                    </div>
                                    <div className="mt-4">
                                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shop</p>
                                      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{shopName}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4 rounded-3xl border border-slate-200/70 bg-slate-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                                  {previewLoading ? (
                                    <p className="text-sm text-muted-foreground">Loading laptop details…</p>
                                  ) : selectedSaleLaptops.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                      <p className="text-sm font-semibold">Items in this sale</p>
                                      {selectedSaleLaptops.map(laptop => {
                                        const item = s.items?.find(i => i.laptop_id === laptop.id);
                                        const qty = item?.quantity || 1;
                                        const price = item?.unit_price || (s.sale_price ?? laptop.sale_price ?? laptop.price ?? 0);
                                        return (
                                          <div key={laptop.id} className="grid gap-4 sm:grid-cols-2 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm">
                                            <div>
                                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Laptop</p>
                                              <p className="mt-1 font-semibold text-slate-950 dark:text-white">{laptop.name}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Shop</p>
                                              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{laptop.shop_name}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quantity & Unit Price</p>
                                              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{qty} × Rs. {price.toLocaleString()}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Item Total</p>
                                              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Rs. {(qty * price).toLocaleString()}</p>
                                            </div>
                                            <div className="sm:col-span-2">
                                              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Specifications</p>
                                              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">{laptop.specs || '—'}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">No laptop details available for this sale.</p>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">Page {page} of {totalPages} — {total || 0} records</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
            <Dialog open={isEditingSale} onOpenChange={(open) => {
              if (!open) {
                setIsEditingSale(false);
                setEditingSale(null);
              }
            }}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle>Edit sale</DialogTitle>
                    <DialogDescription>Update the selected sale record.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Customer name</label>
                      <Input
                        value={editForm.customer_name}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                        placeholder="Customer name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Phone number</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Customer phone"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Sale price</label>
                      <Input
                        type="number"
                        min={0}
                        value={editForm.sale_price}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, sale_price: Number(e.target.value) }))}
                        placeholder="Sale price"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                      <Input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Shop</label>
                      <select
                        value={editForm.shop}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, shop: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                      >
                        <option value="Mini Tech">Mini Tech</option>
                        <option value="T.M. Communication">T.M. Communication</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks</label>
                      <textarea
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                        value={editForm.remarks}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))}
                        placeholder="Update remarks"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-200/70 dark:border-zinc-800">
                      <Button variant="outline" onClick={() => setIsEditingSale(false)}>Cancel</Button>
                      <Button type="button" className="rounded-full" onClick={handleEditSale} disabled={editSubmitting}>{editSubmitting ? 'Saving…' : 'Save changes'}</Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
