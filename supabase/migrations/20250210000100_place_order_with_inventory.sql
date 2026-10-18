create or replace function public.place_order_with_inventory(
  p_order jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id    uuid;
  v_rec         record;
  v_unavailable text[] := '{}';
  v_req_count   int;
  v_found_count int;
  v_subtotal    numeric := 0;
  v_delivery    numeric := coalesce((p_order->>'delivery_fee')::numeric, 0);
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select count(*) into v_req_count
    from (select distinct menu_item_id
            from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int)) s;

  select count(*) into v_found_count
    from public.menu_items
   where id in (select menu_item_id
                  from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int));

  if v_req_count <> v_found_count then
    raise exception 'MENU_ITEM_NOT_FOUND';
  end if;

  -- Pass 1: lock every referenced row in deterministic id order (deadlock-safe).
  perform m.id
     from public.menu_items m
    where m.id in (select menu_item_id
                     from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int))
    order by m.id
      for update;

  -- Pass 2: validate availability + stock against the *aggregated* quantities.
  for v_rec in
    select m.id, m.name, m.is_available, m.stock_quantity,
           sum(r.quantity)::int as requested
      from public.menu_items m
      join jsonb_to_recordset(p_items) as r(menu_item_id uuid, quantity int)
        on r.menu_item_id = m.id
     group by m.id, m.name, m.is_available, m.stock_quantity
  loop
    if not v_rec.is_available
       or (v_rec.stock_quantity is not null and v_rec.stock_quantity < v_rec.requested) then
      v_unavailable := array_append(v_unavailable, v_rec.name);
    end if;
  end loop;

  if array_length(v_unavailable, 1) > 0 then
    raise exception 'ITEMS_UNAVAILABLE: %', array_to_string(v_unavailable, ', ');
  end if;

  -- Server-authoritative total (client never sends money).
  select coalesce(sum(m.price * agg.qty), 0)
    into v_subtotal
    from (select menu_item_id, sum(quantity)::int as qty
            from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int)
           group by menu_item_id) agg
    join public.menu_items m on m.id = agg.menu_item_id;

  -- Create the order. !! ADJUST these columns to match your `orders` schema.
  insert into public.orders (
    customer_name, customer_phone, order_type, notes,
    payment_method, subtotal, total, status
  ) values (
    p_order->>'customer_name',
    p_order->>'customer_phone',
    p_order->>'order_type',
    p_order->>'notes',
    coalesce(p_order->>'payment_method', 'pay_on_collection'),
    v_subtotal,
    v_subtotal + v_delivery,
    'pending'
  ) returning id into v_order_id;

  -- Create line items from server-side prices. !! ADJUST table/columns as needed.
  insert into public.order_items (order_id, menu_item_id, name, quantity, unit_price)
  select v_order_id, m.id, m.name, agg.qty, m.price
    from (select menu_item_id, sum(quantity)::int as qty
            from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int)
           group by menu_item_id) agg
    join public.menu_items m on m.id = agg.menu_item_id;

  -- Decrement stock atomically (tracked items only). Rows already locked.
  update public.menu_items m
     set stock_quantity = m.stock_quantity - agg.qty
    from (select menu_item_id, sum(quantity)::int as qty
            from jsonb_to_recordset(p_items) as x(menu_item_id uuid, quantity int)
           group by menu_item_id) agg
   where m.id = agg.menu_item_id
     and m.stock_quantity is not null;

  return jsonb_build_object('order_id', v_order_id);
end;
$$;

revoke all on function public.place_order_with_inventory(jsonb, jsonb) from public;
grant execute on function public.place_order_with_inventory(jsonb, jsonb) to anon, authenticated;