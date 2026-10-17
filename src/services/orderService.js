import { supabase, getDeviceId } from '../lib/supabase';

function fromDb(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    storeBranch: row.store_branch,
    channel: row.channel,
    customer: row.customer || {},
    items: row.items || [],
    note: row.note,
    total: Number(row.total),
    status: row.status,
    statusHistory: row.status_history || [],
    createdAt: row.created_at,
  };
}

function toDb(order) {
  return {
    id: order.id,
    store_id: order.storeId,
    store_branch: order.storeBranch,
    channel: order.channel,
    customer: order.customer,
    items: order.items,
    note: order.note,
    total: order.total,
    status: order.status,
    status_history: order.statusHistory || [],
    device_id: getDeviceId(),
  };
}

function generateOrderId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CK-${pick(4)}-${pick(2)}`;
}

export async function createOrder({ store, cart, customer, note, channel, total }) {
  const now = new Date().toISOString();
  
  const order = {
    id: generateOrderId(),
    storeId: store.id,
    storeBranch: store.branch,
    channel: channel || 'app',
    customer: {
      name: (customer?.name || '').trim(),
      phone: (customer?.phone || '').trim(),
      pickupTime: customer?.pickupTime || 'As soon as possible',
    },
    items: cart.map((i) => ({
      id: i.id,
      name: i.name,
      image: i.image,
      price: i.price,
      qty: i.qty,
      removedIngredients: i.removedIngredients || [],
      itemNote: i.itemNote || '',
    })),
    note: note?.trim() || null,
    total: Number(total),
    status: 'placed',
    statusHistory: [{ status: 'placed', at: now }],
    createdAt: now,
  };

  const { data, error } = await supabase
    .from('orders')
    .insert(toDb(order))
    .select()
    .single();

  if (error) {
    console.error('[Supabase Create Order Error]:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'Database rejected order');
  }
  
  return fromDb(data);
}

export async function getOrders() {
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) return [];
  return (data || []).map(fromDb);
}

export async function updateOrderStatus(id, status) {
  const { data: current } = await supabase.from('orders').select('status_history').eq('id', id).single();
  const history = [...((current?.status_history) || []), { status, at: new Date().toISOString() }];

  const { data, error } = await supabase
    .from('orders')
    .update({ status, status_history: history })
    .eq('id', id)
    .select()
    .single();

  if (error) return null;
  return fromDb(data);
}

export function subscribeToOrders(callback) {
  getOrders().then(callback);

  const channel = supabase
    .channel('orders-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
      const next = await getOrders();
      callback(next);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export const ORDER_FLOW = ['placed', 'preparing', 'ready', 'completed'];
export const STATUS_LABELS = { placed: 'New', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };