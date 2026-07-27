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
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Navbar } from '@/components/navbar';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans px-4 py-6 md:px-6 md:py-8">
      <div className="max-w-5xl mx-auto mb-10">
        <Navbar />
      </div>
      <header className="max-w-5xl mx-auto mb-6">
        <div className="mb-6 flex w-full max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="mb-0 flex items-center justify-center">
              <img
                src="/icon.png"
                alt="LapTrack Logo"
                className="h-20 w-20 rounded-3xl object-contain drop-shadow-lg sm:h-24 sm:w-24"
              />
            </div>
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-950 dark:text-white mb-3">Dealer management</h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-7">
                Add and manage dealer contacts. Dealers can be assigned to laptops from the inventory page.
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Button variant="outline" onClick={() => router.back()} className="rounded-full">
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6" ref={formRef}>
        <Card className="rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl">{editingDealer ? 'Edit dealer' : 'Add a new dealer'}</CardTitle>
            <CardDescription>
              {editingDealer ? 'Update the dealer contact details.' : 'Keep contact details and optional remarks for your supplier network.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dealer name" {...field} />
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
                        <Textarea placeholder="Any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {editingDealer && (
                    <Button type="button" variant="outline" className="rounded-full px-5" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit" className="rounded-full px-5" disabled={isSubmitting}>
                    {isSubmitting ? (editingDealer ? 'Saving…' : 'Saving…') : (editingDealer ? 'Update dealer' : 'Save dealer')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <section className="rounded-3xl border border-slate-200/70 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-slate-200/70 px-6 py-5 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Dealer contacts</h2>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-zinc-800">
              <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 uppercase tracking-[.2em] text-xs">
                <tr>
                  <th className="px-4 py-3">Dealer</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
                {dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-slate-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{dealer.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{dealer.contact}</td>
                    <td className="px-4 py-4 text-slate-500 dark:text-slate-400">{dealer.remarks || '—'}</td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => startEditDealer(dealer)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(dealer.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {dealers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No dealers yet. Add one to link them to laptops in inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
