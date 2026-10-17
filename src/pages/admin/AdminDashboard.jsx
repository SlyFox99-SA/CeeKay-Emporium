import { useEffect, useState } from 'react';
import { Receipt, Utensils, TrendingUp, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, menuCount: 0, statusCounts: { placed: 0, preparing: 0, ready: 0 } });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const [ordersRes, menuRes] = await Promise.all([
        supabase.from('orders').select('*').gte('created_at', startOfToday.toISOString()),
        supabase.from('menu_items').select('id', { count: 'exact', head: true }),
      ]);
      const orders = ordersRes.data || [];
      const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);
      const statusCounts = orders.reduce((acc, o) => { if (acc[o.status] !== undefined) acc[o.status]++; return acc; }, { placed: 0, preparing: 0, ready: 0 });
      setStats({ todayOrders: orders.length, todayRevenue: revenue, menuCount: menuRes.count || 0, statusCounts });
      setLoading(false);
    })();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <div className="admin-page-eyebrow">Overview</div>
          <h1 className="admin-page-title">Dashboard</h1>
        </div>
      </header>
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
          <span className="admin-kpi-icon"><Utensils size={18} /></span>
          <div><div className="admin-kpi-label">Menu items</div><div className="admin-kpi-value">{loading ? '—' : stats.menuCount}</div></div>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi-icon"><TrendingUp size={18} /></span>
          <div><div className="admin-kpi-label">In progress</div><div className="admin-kpi-value">{loading ? '—' : stats.statusCounts.placed + stats.statusCounts.preparing}</div></div>
        </div>
      </div>
      <div className="admin-empty">
        <div className="admin-empty-title">Welcome to the back office.</div>
        <div className="admin-empty-sub">Head to <strong>Menu</strong> to edit items, or <strong>Orders</strong> to see today's activity.</div>
      </div>
    </div>
  );
}