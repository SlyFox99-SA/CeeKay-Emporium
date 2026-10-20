import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendNotification, deserializeVapidKeys } from 'https://esm.sh/web-push-browser@1.4.2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = 'mailto:info@ceekayemporium.co.za'

serve(async (req) => {
  try {
    const payload = await req.json()
    
    // Supabase Database Webhook payload structure
    const { type, table, record, old_record } = payload

    // 1. Only process UPDATE events on the 'orders' table
    if (type !== 'UPDATE' || table !== 'orders') {
      return new Response("Ignored: Not an order update", { status: 200 })
    }

    // 2. Only process if the status changed TO 'ready'
    const isReady = record.status === 'ready'
    const wasNotReady = old_record?.status !== 'ready'

    if (!isReady || !wasNotReady) {
      return new Response("Ignored: Order is not newly ready", { status: 200 })
    }

    // 3. Extract necessary data from the row
    const user_id = record.user_id
    const order_id = record.id
    const order_number = record.order_number || record.id.substring(0, 6)

    if (!user_id) {
      return new Response("Ignored: No user_id associated with order", { status: 200 })
    }

    // 4. Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. Fetch push subscriptions for the user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return new Response("No subscriptions found for user", { status: 200 })
    }

    // 6. Prepare and send the push notification
    const keyPair = await deserializeVapidKeys({
      publicKey: VAPID_PUBLIC_KEY,
      privateKey: VAPID_PRIVATE_KEY,
    })

    const pushPayload = JSON.stringify({
      title: "Your Kota is Ready! 🍔",
      body: `Order #${order_number} is hot and ready for collection.`,
      url: `https://ceekayemporium.co.za/#/order/${order_id}`
    })

    const pushPromises = subs.map(sub =>
      sendNotification(
        keyPair,
        { endpoint: sub.endpoint, keys: { auth: sub.auth, p256dh: sub.p256dh } },
        VAPID_SUBJECT,
        pushPayload
      ).catch(err => console.error("Push failed for endpoint:", sub.endpoint, err))
    )

    await Promise.all(pushPromises)

    return new Response(JSON.stringify({ success: true, notified_devices: subs.length }), { 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (error) {
    console.error("Webhook error:", error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    })
  }
})