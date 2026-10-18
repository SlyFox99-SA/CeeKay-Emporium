import { supabase, getDeviceId } from '../lib/supabase';

function fromDb(row) {
  return {
    id: row.id,
    storeId: row.store_id,
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

function toOrderError(error) {
  const msg = error?.message ?? '';
  if (msg.includes('ITEMS_UNAVAILABLE')) {
    const items = msg.split('ITEMS_UNAVAILABLE:')[1]?.trim() ?? 'some items';
    return new Error(`Sorry, ${items} just sold out. Please update your cart.`);
  }
  if (msg.includes('MENU_ITEM_NOT_FOUND')) {
    return new Error('One of your items is no longer on the menu. Please refresh.');
  }
  if (msg.includes('EMPTY_CART')) {
    return new Error('Your cart is empty.');
  }
  // Show the actual database error for debugging
  return new Error(msg || 'We could not place your order. Please try again.');
}

export async function createOrder({ order, items }) {
  const { data, error } = await supabase.rpc('place_order_with_inventory', {
    p_order: order,
    p_items: items.map(({ id, quantity }) => ({ menu_item_id: id, quantity })),
  });

  if (error) throw toOrderError(error);
  return { id: data.order_id };
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