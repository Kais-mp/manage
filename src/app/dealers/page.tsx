'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Dealer } from '@/types/dealer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';
import { ArrowLeft, Users, UserPlus } from 'lucide-react';

const dealerSchema = z.object({
  name: z.string().min(2, { message: 'Dealer name is required.' }),
  contact: z.string().min(8, { message: 'Contact number is required.' }),
  remarks: z.string().max(200).optional(),
});

type DealerFormValues = z.infer<typeof dealerSchema>;

export default function DealersPage() {
  const router = useRouter();
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDealer, setEditingDealer] = useState<Dealer | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<DealerFormValues>({
    resolver: zodResolver(dealerSchema),
    defaultValues: {
      name: '',
      contact: '',
      remarks: '',
    },
  });

  async function fetchDealers() {
    setLoading(true);
    const { data, error } = await supabase.from('dealers').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Unable to load dealers');
    } else {
      setDealers(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchDealers();
  }, []);

  async function onSubmit(values: DealerFormValues) {
    setIsSubmitting(true);
    let error = null;

    if (editingDealer) {
      const { error: updateError } = await supabase.from('dealers').update(values).eq('id', editingDealer.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('dealers').insert([{ ...values }]);
      error = insertError;
    }

    if (error) {
      toast.error(editingDealer ? 'Could not update dealer' : 'Could not save dealer');
    } else {
      toast.success(editingDealer ? 'Dealer updated' : 'Dealer added');
      form.reset();
      setEditingDealer(null);
      fetchDealers();
    }
    setIsSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this dealer?')) return;
    const { error } = await supabase.from('dealers').delete().eq('id', id);
    if (error) {
      toast.error('Could not delete dealer');
      return;
    }
    toast.success('Dealer deleted');
    if (editingDealer?.id === id) {
      setEditingDealer(null);
      form.reset();
    }
    fetchDealers();
  }

  function startEditDealer(dealer: Dealer) {
    setEditingDealer(dealer);
    form.reset({
      name: dealer.name,
      contact: dealer.contact,
      remarks: dealer.remarks || '',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingDealer(null);
    form.reset();
  }

  return (
    <div className="min-h-screen font-sans px-4 py-6 md:px-8 md:py-10 relative">
      <Navbar />

      <header className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dealer Network</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage supplier contacts and associate them with laptops in your inventory.
              </p>
            </div>
          </div>
          <div>
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8" ref={formRef}>
        <Card className="glass-card">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <span>{editingDealer ? 'Edit Dealer Details' : 'Add New Dealer'}</span>
            </CardTitle>
            <CardDescription>
              {editingDealer ? 'Update existing supplier contact details.' : 'Register new dealer contact and optional remarks.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dealer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Al-Madina Traders" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone or WhatsApp number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="sm:col-span-2">
                  <FormField control={form.control} name="remarks" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks (optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Payment terms, locations or additional notes..." className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-white/10 rounded-2xl p-3 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15 transition-all outline-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end pt-2">
                  {editingDealer && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : (editingDealer ? 'Update Dealer' : 'Save Dealer')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="glass-card p-0 overflow-hidden">
          <div className="border-b border-slate-200/80 dark:border-white/10 px-6 py-4 bg-slate-100/40 dark:bg-slate-800/20 backdrop-blur-md">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Registered Dealers ({dealers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dealer Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealers.map((dealer) => (
                  <TableRow key={dealer.id}>
                    <TableCell className="font-bold text-slate-900 dark:text-white">{dealer.name}</TableCell>
                    <TableCell className="font-medium text-slate-700 dark:text-slate-300">{dealer.contact}</TableCell>
                    <TableCell className="text-slate-500 dark:text-slate-400">{dealer.remarks || '—'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEditDealer(dealer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(dealer.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {dealers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No dealers registered yet. Add one above.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </main>
    </div>
  );
}
