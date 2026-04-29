import { useState, useEffect, useMemo } from 'react';
import { HiOutlineTrash } from 'react-icons/hi2';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';

interface Order {
  id: number;
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  status: string;
  createdAt: string;
  items: Array<{ product: { nameRu: string }; size?: string; color?: string; quantity: number }>;
}

interface WholesaleReq {
  id: number;
  company: string;
  name: string;
  phone: string;
  email: string;
  city?: string;
  comment?: string;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  new: 'Новый',
  processing: 'В работе',
  done: 'Выполнен',
  cancelled: 'Отменён',
};
const statusColors: Record<string, string> = {
  new: 'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  done: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

type MainTab = 'orders' | 'wholesale';
type StatusTab = 'new' | 'processing' | 'done' | 'cancelled';

const statusTabs: { key: StatusTab; label: string }[] = [
  { key: 'new', label: 'Новые' },
  { key: 'processing', label: 'В работе' },
  { key: 'done', label: 'Выполненные' },
  { key: 'cancelled', label: 'Отменённые' },
];

function ColorBadge({ raw }: { raw: string }) {
  let hex = raw, name = raw;
  try {
    const p = JSON.parse(raw);
    if (p.hex) { hex = p.hex; name = p.name || p.hex; }
  } catch {}
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <span
        className="w-3.5 h-3.5 rounded-full border border-[#E5E5E3] inline-block"
        style={{ backgroundColor: hex }}
      />
      <span>{name}</span>
    </span>
  );
}

export default function AdminOrders() {
  const [mainTab, setMainTab] = useState<MainTab>('orders');
  const [statusFilter, setStatusFilter] = useState<StatusTab>('new');
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesale, setWholesale] = useState<WholesaleReq[]>([]);

  const loadOrders = () => api.get('/orders', { params: { limit: 200 } }).then((r) => setOrders(r.data.orders));
  const loadWholesale = () => api.get('/wholesale', { params: { limit: 200 } }).then((r) => setWholesale(r.data.requests));

  useEffect(() => { loadOrders(); loadWholesale(); }, []);

  const updateOrderStatus = async (id: number, status: string) => {
    await api.put(`/orders/${id}`, { status });
    loadOrders();
  };

  const updateWholesaleStatus = async (id: number, status: string) => {
    await api.put(`/wholesale/${id}`, { status });
    loadWholesale();
  };

  const deleteOrder = async (id: number) => {
    if (!confirm(`Удалить заказ #${id} безвозвратно?`)) return;
    await api.delete(`/orders/${id}`);
    loadOrders();
  };

  const deleteWholesale = async (id: number) => {
    if (!confirm(`Удалить заявку #${id} безвозвратно?`)) return;
    await api.delete(`/wholesale/${id}`);
    loadWholesale();
  };

  const filteredOrders = useMemo(
    () => orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  const filteredWholesale = useMemo(
    () => wholesale.filter((w) => w.status === statusFilter),
    [wholesale, statusFilter]
  );

  const orderCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, processing: 0, done: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [orders]);

  const wholesaleCounts = useMemo(() => {
    const counts: Record<string, number> = { new: 0, processing: 0, done: 0, cancelled: 0 };
    wholesale.forEach((w) => { if (counts[w.status] !== undefined) counts[w.status]++; });
    return counts;
  }, [wholesale]);

  const counts = mainTab === 'orders' ? orderCounts : wholesaleCounts;

  function OrderStatusButtons({ id, currentStatus }: { id: number; currentStatus: string }) {
    const actions: { status: string; label: string; cls: string }[] = [];
    if (currentStatus !== 'processing') actions.push({ status: 'processing', label: 'В работу', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' });
    if (currentStatus !== 'done') actions.push({ status: 'done', label: 'Выполнен', cls: 'bg-green-50 text-green-700 hover:bg-green-100' });
    if (currentStatus !== 'cancelled') actions.push({ status: 'cancelled', label: 'Отменить', cls: 'bg-red-50 text-red-700 hover:bg-red-100' });
    if (currentStatus === 'done' || currentStatus === 'cancelled') actions.push({ status: 'processing', label: 'Вернуть в работу', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' });
    const unique = actions.filter((a, i, arr) => arr.findIndex((x) => x.status === a.status) === i);
    return (
      <div className="flex flex-wrap gap-2">
        {unique.map((a) => (
          <button key={a.status} onClick={() => updateOrderStatus(id, a.status)} className={`text-xs px-3 py-1 rounded-full ${a.cls}`}>
            {a.label}
          </button>
        ))}
        {currentStatus === 'cancelled' && (
          <button onClick={() => deleteOrder(id)} className="text-xs px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1">
            <HiOutlineTrash className="w-3 h-3" />
            Удалить
          </button>
        )}
      </div>
    );
  }

  function WholesaleStatusButtons({ id, currentStatus }: { id: number; currentStatus: string }) {
    const actions: { status: string; label: string; cls: string }[] = [];
    if (currentStatus !== 'processing') actions.push({ status: 'processing', label: 'В работу', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' });
    if (currentStatus !== 'done') actions.push({ status: 'done', label: 'Выполнена', cls: 'bg-green-50 text-green-700 hover:bg-green-100' });
    if (currentStatus !== 'cancelled') actions.push({ status: 'cancelled', label: 'Отменить', cls: 'bg-red-50 text-red-700 hover:bg-red-100' });
    if (currentStatus === 'done' || currentStatus === 'cancelled') actions.push({ status: 'processing', label: 'Вернуть в работу', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' });
    const unique = actions.filter((a, i, arr) => arr.findIndex((x) => x.status === a.status) === i);
    return (
      <div className="flex flex-wrap gap-2">
        {unique.map((a) => (
          <button key={a.status} onClick={() => updateWholesaleStatus(id, a.status)} className={`text-xs px-3 py-1 rounded-full ${a.cls}`}>
            {a.label}
          </button>
        ))}
        {currentStatus === 'cancelled' && (
          <button onClick={() => deleteWholesale(id)} className="text-xs px-3 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-1">
            <HiOutlineTrash className="w-3 h-3" />
            Удалить
          </button>
        )}
      </div>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold mb-6">Заказы и заявки</h1>

      {/* Main tabs: orders / wholesale */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMainTab('orders')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${mainTab === 'orders' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E5E3]'}`}
        >
          Заказы ({orders.length})
        </button>
        <button
          onClick={() => setMainTab('wholesale')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${mainTab === 'wholesale' ? 'bg-[#1A1A1A] text-white' : 'bg-white border border-[#E5E5E3]'}`}
        >
          Оптовые ({wholesale.length})
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.key ? 'bg-white shadow-sm text-[#1A1A1A]' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                tab.key === 'new' ? 'bg-yellow-100 text-yellow-700' :
                tab.key === 'cancelled' ? 'bg-red-100 text-red-700' :
                'bg-gray-200 text-gray-600'
              }`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {mainTab === 'orders' && (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-medium">Заказ #{order.id}</span>
                  <span className="text-[#6B6B6B] text-sm ml-3">{new Date(order.createdAt).toLocaleDateString('ru')}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>{statusLabels[order.status]}</span>
              </div>
              <p className="text-sm mb-1">👤 {order.name} | 📞 {order.phone} {order.email && `| 📧 ${order.email}`}</p>
              {order.comment && <p className="text-sm text-[#6B6B6B] mb-2">💬 {order.comment}</p>}
              <div className="text-sm text-[#6B6B6B] mb-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-x-2">
                    <span>• {item.product.nameRu} (x{item.quantity})</span>
                    {item.size && <span>| {item.size}</span>}
                    {item.color && <span className="inline-flex items-center gap-1">| <ColorBadge raw={item.color} /></span>}
                  </div>
                ))}
              </div>
              <OrderStatusButtons id={order.id} currentStatus={order.status} />
            </div>
          ))}
          {filteredOrders.length === 0 && <p className="text-[#6B6B6B] text-center py-8">Нет заказов в этой категории</p>}
        </div>
      )}

      {/* Wholesale list */}
      {mainTab === 'wholesale' && (
        <div className="space-y-4">
          {filteredWholesale.map((req) => (
            <div key={req.id} className="bg-white p-5 rounded-xl">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-medium">Заявка #{req.id}</span>
                  <span className="text-[#6B6B6B] text-sm ml-3">{new Date(req.createdAt).toLocaleDateString('ru')}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[req.status]}`}>{statusLabels[req.status]}</span>
              </div>
              <p className="text-sm mb-1">🏢 {req.company} | 👤 {req.name}</p>
              <p className="text-sm mb-1">📞 {req.phone} | 📧 {req.email} {req.city && `| 📍 ${req.city}`}</p>
              {req.comment && <p className="text-sm text-[#6B6B6B] mb-2">💬 {req.comment}</p>}
              <WholesaleStatusButtons id={req.id} currentStatus={req.status} />
            </div>
          ))}
          {filteredWholesale.length === 0 && <p className="text-[#6B6B6B] text-center py-8">Нет заявок в этой категории</p>}
        </div>
      )}
    </AdminLayout>
  );
}
