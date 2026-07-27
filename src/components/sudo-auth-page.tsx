'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAdminUser } from '@/lib/admin-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface SudoAuthPageProps {
  mode?: 'signin' | 'signup';
  allowModeSwitch?: boolean;
}

export function SudoAuthPage({ mode = 'signin', allowModeSwitch = true }: SudoAuthPageProps) {
  const router = useRouter();
  const [activeMode, setActiveMode] = useState<'signin' | 'signup'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    setActiveMode(mode);
  }, [mode]);

  useEffect(() => {
    let active = true;

    async function boot() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;

      if (isAdminUser(user)) {
        router.replace('/sudo');
        return;
      }

      setCheckingSession(false);
    }

    boot();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);

    try {
      if (activeMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'admin',
            },
          },
        });
        if (error) throw error;

        toast.success('Admin account created. Sign in from the login page now.');
        router.replace('/sudo/login');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const currentUser = data.user;
      if (isAdminUser(currentUser)) {
        toast.success('Signed in successfully');
        router.replace('/sudo');
        return;
      }

      toast.error('This account is not authorized for the admin panel.');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to complete the request.');
    } finally {
      setLoading(false);
    }
  }

  const helperText = useMemo(() => {
    return activeMode === 'signin'
      ? 'Sign in with a verified admin account.'
      : 'Create an admin account. Access is granted automatically.';
  }, [activeMode]);

  if (checkingSession) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Preparing admin access…</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="flex items-center gap-2 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </div>

        <Card className="border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <ShieldCheck className="h-5 w-5" />
              {activeMode === 'signin' ? 'Admin sign in' : 'Create admin account'}
            </CardTitle>
            <CardDescription>{helperText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? (activeMode === 'signin' ? 'Signing in…' : 'Creating account…') : (activeMode === 'signin' ? 'Sign in' : 'Create account')}
              </Button>
            </form>

            {allowModeSwitch ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setActiveMode(activeMode === 'signin' ? 'signup' : 'signin')}
              >
                {activeMode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
