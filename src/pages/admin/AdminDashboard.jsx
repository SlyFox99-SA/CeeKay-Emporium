import { useEffect, useState } from 'react';
import { Receipt, DollarSign, TrendingUp, Utensils, Trophy } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import StoreSelector from '../../components/admin/StoreSelector';

export default function AdminDashboard() {
  const [selectedStore, setSelectedStore] = useState('all');
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, menuCount: 0, activeOrders: 0 });
  const [chartData, setChartData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      setLoading(true);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      let ordersQuery = supabase.from('orders').select('*').gte('created_at', sevenDaysAgo.toISOString());
      if (selectedStore !== 'all') {
        ordersQuery = ordersQuery.eq('store_id', selectedStore);
      }

      let menuQuery = supabase.from('menu_items').select('id', { count: 'exact', head: true });
      // Note: If your menu_items table has a store_id in the future, filter it here too.

      const [ordersRes, menuRes] = await Promise.all([ordersQuery, menuQuery]);

      if (!isMounted) return;

      const orders = ordersRes.data || [];
      
      // 1. KPI Calculations
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(o => new Date(o.created_at) >= startOfToday);
      const todayRevenue = todayOrders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      const activeOrders = orders.filter(o => ['placed', 'preparing', 'ready'].includes(o.status));

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        menuCount: menuRes.count || 0,
        activeOrders: activeOrders.length
      });

      // 2. Chart Data
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

      // 3. Top Selling Items Logic
      const itemCounts = {};
      orders.filter(o => o.status !== 'cancelled').forEach(order => {
        const items = order.items || [];
        items.forEach(item => {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = { name: item.name, qty: 0, image: item.image };
          }
          itemCounts[item.name].qty += item.qty;
        });
      });

      const sortedItems = Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 4);
      setTopItems(sortedItems);

      setLoading(false);
    })();

    return () => { isMounted = false; };
  }, [selectedStore]);

  return (
    <div className="admin-page">
      <header className="admin-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="admin-page-eyebrow">Overview</div>
          <h1 className="admin-page-title">Dashboard</h1>
        </div>
        <StoreSelector selectedStore={selectedStore} onChange={setSelectedStore} />
      </header>

      {/* KPI Cards */}
      <div className="admin-kpis">
        <div className="admin-kpi">
          <span className="admin-kpi-icon"><Receipt size={18} /></span>
          <div><div className="admin-kpi-label">Orders today</div><div className="admin-kpi-value">{loading ? '—' : stats.todayOrders}</div></div>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-icon"><DollarSign size={18} /></span>
          <div><div className="admin-kpi-label">Revenue today</div><div className="admin-kpi-value">R {loading ? '—' : stats.todayRevenue.toFixed(2)}</div></div>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-icon"><TrendingUp size={18} /></span>
          <div><div className="admin-kpi-label">Active Orders</div><div className="admin-kpi-value">{loading ? '—' : stats.activeOrders}</div></div>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-icon"><Utensils size={18} /></span>
          <div><div className="admin-kpi-label">Menu items</div><div className="admin-kpi-value">{loading ? '—' : stats.menuCount}</div></div>
        </div>
      </div>

      {/* The SaaS Chart */}
      {!loading && (
        <div className="admin-chart-container">
          <div className="admin-chart-header">
            <h3>Revenue (Last 7 Days)</h3>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0,bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--ck-brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--ck-brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12 }} dy={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`R ${value.toFixed(2)}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--ck-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Sellers List */}
      {!loading && topItems.length > 0 && (
        <div className="admin-chart-container">
          <div className="admin-chart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color="var(--ck-warm)" /> Top Sellers
            </h3>
          </div>
          <div className="admin-top-sellers">
            {topItems.map((item, index) => (
              <div key={index} className="admin-top-seller-row">
                <div className="admin-top-seller-rank">#{index + 1}</div>
                <div className="admin-top-seller-img">
                  <img src={item.image} alt={item.name} />
                </div>
                <div className="admin-top-seller-name">{item.name}</div>
                <div className="admin-top-seller-qty">{item.qty} sold</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}