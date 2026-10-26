 
import { supabase, getDeviceId } from '../lib/supabase';

function fromDb(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    storeId: row.store_id,
    channel: row.channel,
    customer: row.customer || {},
    items: row.items || [],
    note: row.note,
    total: Number(row.total),
    status: row.status,
    statusHistory: row.status_history || [],
    prepStartedAt: row.prep_started_at,
    createdAt: row.created_at,
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
  return new Error(msg || 'We could not place your order. Please try again.');
}

export async function createOrder({ order, items }) {
  try {
    const { data, error } = await supabase.rpc('place_order_with_inventory', {
      p_order: order,
      p_items: items.map(({ id, quantity, modifier_ids }) => ({ menu_item_id: id, quantity, modifier_ids })),
    });
    if (error) throw toOrderError(error);
    return { id: data.order_id, orderNumber: data.order_number };
  } catch (err) {
    console.error('createOrder failed:', err);
    throw err;
  }
}

export async function getOrders() {
  try {
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    return (data || []).map(fromDb);
  } catch (err) {
    console.error('getOrders failed:', err);
    return [];
  }
}

export async function updateOrderStatus(id, status) {
  try {
    // 1. Fetch current history gracefully
    const { data: current } = await supabase.from('orders').select('status_history').eq('id', id).maybeSingle(); // FIXED
    const history = [...((current?.status_history) || []), { status, at: new Date().toISOString() }];

    // 2. Update the row
    const updates = { status, status_history: history };
    if (status === 'preparing') {
      updates.prep_started_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    
    // 3. Return the expected object
    return { id, status, status_history: history };
  } catch (err) {
    console.error('updateOrderStatus failed:', err);
    return null;
  }
}

export async function cancelOrder(orderId) {
  try {
    const { data, error } = await supabase.rpc('cancel_order', { p_order_id: orderId });
    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error('cancelOrder failed:', err);
    throw err;
  }
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
