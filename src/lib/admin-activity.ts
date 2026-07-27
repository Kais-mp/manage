import { supabase } from '@/lib/supabase';

export type AdminActivityEntry = {
  id?: string;
  action: string;
  details: string;
  user_email: string | null;
  actor_name?: string | null;
  machine_address?: string | null;
  user_id: string | null;
  created_at: string;
  source?: string;
};

const ACTOR_STORAGE_KEY = 'laptrack-actor';
const MACHINE_ADDRESS_KEY = 'laptrack-machine-address';

export function getMachineAddress() {
  if (typeof window === 'undefined') return null;

  let address = window.localStorage.getItem(MACHINE_ADDRESS_KEY);
  if (!address) {
    address = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `machine-${Date.now()}`;

    try {
      window.localStorage.setItem(MACHINE_ADDRESS_KEY, address);
    } catch {
      // ignore storage issues
    }
  }

  return address;
}

export function getSavedActor() {
  if (typeof window === 'undefined') return null;

  const stored = window.localStorage.getItem(ACTOR_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as { user_email?: string | null; actor_name?: string | null; machine_address?: string | null };
  } catch {
    return null;
  }
}

export function saveActor(actor: { user_email?: string | null; actor_name?: string | null; machine_address?: string | null }) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ACTOR_STORAGE_KEY, JSON.stringify(actor));
  } catch {
    // ignore storage issues
  }
}

function getBrowserIdentity() {
  if (typeof window === 'undefined') {
    return {
      user_email: 'system',
      actor_name: null,
      machine_address: null,
      user_id: null,
    };
  }

  const savedActor = getSavedActor();
  const machineAddress = getMachineAddress();

  return {
    user_email: savedActor?.user_email ?? null,
    actor_name: savedActor?.actor_name ?? null,
    machine_address: savedActor?.machine_address ?? machineAddress,
    user_id: null,
  };
}

export async function logAdminActivity(action: string, details: string, userEmail?: string) {
  const actor = userEmail
    ? { user_email: userEmail, actor_name: null, machine_address: getMachineAddress(), user_id: null }
    : getBrowserIdentity();

  const entry: AdminActivityEntry = {
    action,
    details,
    user_email: actor.user_email,
    actor_name: actor.actor_name ?? null,
    machine_address: actor.machine_address ?? null,
    user_id: actor.user_id,
    created_at: new Date().toISOString(),
    source: 'app-action',
  };

  const { error } = await supabase.from('admin_activity').insert([entry]);
  if (error) {
    console.error('Failed to log admin activity:', error.message || error);
  }
}

export type AdminActivityResponse = {
  items: AdminActivityEntry[];
  count: number;
};

export async function fetchAdminActivity(page = 1, limit = 20): Promise<AdminActivityResponse> {
  try {
    const from = (page - 1) * limit;
    const to = page * limit - 1;
    const { data, error, count } = await supabase
      .from('admin_activity')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to load admin activity:', error.message || error);
      return { items: [], count: 0 };
    }

    return { items: (data ?? []) as AdminActivityEntry[], count: count ?? 0 };
  } catch (error) {
    console.error('Failed to load admin activity:', error);
    return { items: [], count: 0 };
  }
}
