/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Receipt, DollarSign, TrendingUp, Utensils, Trophy, MonitorSmartphone, ChefHat } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { useSilentPolling } from '../../hooks/useSilentPolling';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, menuCount: 0, activeOrders: 0 });
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const ordersQuery = supabase.from('orders').select('*').gte('created_at', sevenDaysAgo.toISOString());
      const menuQuery = supabase.from('menu_items').select('id', { count: 'exact', head: true });

      const [ordersRes, menuRes] = await Promise.all([ordersQuery, menuQuery]);
      const orders = ordersRes.data || [];
      
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.created_at) >= startOfToday);
      const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      const activeOrders = orders.filter(o => ['placed', 'pending', 'preparing', 'ready'].includes(o.status));

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        menuCount: menuRes.count || 0,
        activeOrders: activeOrders.length
      });

      const dailyData = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-ZA', { weekday: 'short' });
        dailyData[dateStr] = { name: dateStr, revenue: 0 };
      }

      orders.filter(o => o.status !== 'cancelled').forEach(o => {
        const dateStr = new Date(o.created_at).toLocaleDateString('en-ZA', { weekday: 'short' });
        if (dailyData[dateStr]) dailyData[dateStr].revenue += Number(o.total);
      });
      setChartData(Object.values(dailyData));

      const itemCounts = {};
      orders.filter(o => o.status !== 'cancelled').forEach(order => {
        (order.items || []).forEach(item => {
          if (!itemCounts[item.name]) itemCounts[item.name] = { name: item.name, qty: 0, image: item.image };
          itemCounts[item.name].qty += item.qty;
        });
      });

      const sortedItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 4);
      setTopItems(sortedItems);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(false); }, []);
  useSilentPolling(() => { fetchDashboardData(true); }, 30000);

  return (
    <div style={{ padding: '24px 20px' }}>
      
      {/* QUICK LAUNCH PORTAL */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '24px', margin: '0 0 16px', color: 'var(--ck-ink)' }}>Quick Launch</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          
          <button onClick={() => navigate('/pos')} style={{ background: 'var(--ck-brand-deep)', color: 'white', padding: '24px', borderRadius: '20px', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 20px rgba(15,46,74,0.2)' }}>
            <MonitorSmartphone size={32} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Cashier POS</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Take walk-in orders</div>
            </div>
          </button>

          <button onClick={() => navigate('/kitchen')} style={{ background: 'var(--ck-warm)', color: 'var(--ck-charcoal)', padding: '24px', borderRadius: '20px', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 8px 20px rgba(212,149,43,0.2)' }}>
            <ChefHat size={32} />
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>Kitchen Display</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Start shift & cook</div>
            </div>
          </button>

        </div>
      </div>

      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ck-brand-deep)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Overview</div>
          <h1 style={{ fontFamily: 'var(--ck-font-serif)', fontSize: '28px', margin: 0, color: 'var(--ck-ink)' }}>Dashboard</h1>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--ck-brand-deep)' }}><Receipt size={18} /></div>
          <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>Orders today</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{loading ? '-' : stats.todayOrders}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--ck-brand-deep)' }}><DollarSign size={18} /></div>
          <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>Revenue</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>R {loading ? '-' : stats.todayRevenue.toFixed(2)}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--ck-brand-deep)' }}><TrendingUp size={18} /></div>
          <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>Active Orders</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{loading ? '-' : stats.activeOrders}</div>
        </div>
        <div style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--ck-brand-deep)' }}><Utensils size={18} /></div>
          <div style={{ fontSize: '12px', color: 'var(--ck-ink-soft)', fontWeight: 600 }}>Menu items</div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{loading ? '-' : stats.menuCount}</div>
        </div>
      </div>

      {!loading && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--ck-border)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>Revenue (Last 7 Days)</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ck-brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--ck-brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12 }} dy={10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value) => [`R ${value.toFixed(2)}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="var(--ck-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!loading && topItems.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid var(--ck-border)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 16px', fontSize: '16px', fontWeight: 700 }}>
            <Trophy size={18} color="var(--ck-warm)" /> Top Sellers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--ck-cream)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ fontWeight: 800, color: 'var(--ck-brand-deep)' }}>#{index + 1}</div>
                <img src={item.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop"} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flex: 1, fontWeight: 600, fontSize: '14px' }}>{item.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--ck-ink-soft)', fontWeight: 700 }}>{item.qty} sold</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
