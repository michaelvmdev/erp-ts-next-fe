'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, PageHeader, inputClass, labelClass } from '@/components/ui';
import { http } from '@/lib/api/http';

interface PosProduct { product_id: string; product_code: string; product_description: string; sale_price: string; stock: string }
interface PosSession { sessionId: string; cashierEmail: string; openingAmount: string; totalSales: string; salesCount: number; status: string; openedAt: string }
interface CartLine { product: PosProduct; qty: number }
interface TodayStats { totalSales: string; salesCount: number; sessionsCount: number }

const IGV = 0.18;

function fmt(n: number | string) { return `S/ ${Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`; }

export default function PosPage() {
  const [session, setSession]     = useState<PosSession | null>(null);
  const [cart, setCart]           = useState<CartLine[]>([]);
  const [search, setSearch]       = useState('');
  const [products, setProducts]   = useState<PosProduct[]>([]);
  const [stats, setStats]         = useState<TodayStats | null>(null);
  const [loading, setLoading]     = useState(false);
  const [openAmt, setOpenAmt]     = useState('');
  const [closeAmt, setCloseAmt]   = useState('');
  const [showClose, setShowClose] = useState(false);
  const [payMethod, setPayMethod] = useState<'cash' | 'card'>('cash');
  const [checkingOut, setCheckingOut] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadSession = useCallback(async () => {
    try {
      const s = await http.get<PosSession | null>('/pos/sessions/open');
      setSession(s);
    } catch { setSession(null); }
  }, []);

  const loadStats = useCallback(async () => {
    try { setStats(await http.get('/pos/stats/today')); } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadSession(); loadStats(); }, [loadSession, loadStats]);

  useEffect(() => {
    if (!search.trim()) { setProducts([]); return; }
    const t = setTimeout(async () => {
      try { setProducts(await http.get<PosProduct[]>('/pos/products', { search })); } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  function addToCart(p: PosProduct) {
    setCart((prev) => {
      const exists = prev.find((l) => l.product.product_id === p.product_id);
      if (exists) return prev.map((l) => l.product.product_id === p.product_id ? { ...l, qty: l.qty + 1 } : l);
      return [...prev, { product: p, qty: 1 }];
    });
    setSearch(''); setProducts([]);
    searchRef.current?.focus();
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) { setCart((p) => p.filter((l) => l.product.product_id !== id)); return; }
    setCart((p) => p.map((l) => l.product.product_id === id ? { ...l, qty } : l));
  }

  const subtotal = cart.reduce((s, l) => s + parseFloat(l.product.sale_price) * l.qty, 0);
  const igvAmt   = subtotal * IGV / (1 + IGV);
  const total    = subtotal;

  async function openSession() {
    if (!openAmt) return;
    setLoading(true);
    try {
      const s = await http.post<PosSession>('/pos/sessions/open', { openingAmount: parseFloat(openAmt) });
      setSession(s); setOpenAmt('');
    } finally { setLoading(false); }
  }

  async function closeSession() {
    if (!session) return;
    setLoading(true);
    try {
      await http.patch(`/pos/sessions/${session.sessionId}/close`, { closingAmount: parseFloat(closeAmt) || 0 });
      setSession(null); setShowClose(false); setCloseAmt(''); loadStats();
    } finally { setLoading(false); }
  }

  async function checkout() {
    if (!session || cart.length === 0) return;
    setCheckingOut(true);
    try {
      await http.post('/sales', {
        saleDate:       new Date().toISOString().slice(0, 10),
        subTotal:       (subtotal - igvAmt).toFixed(2),
        igv:            igvAmt.toFixed(2),
        total:          total.toFixed(2),
        status:         'completed',
        paymentStatus:  'paid',
        posSessionId:   session.sessionId,
        details: cart.map((l) => ({
          productId:  l.product.product_id,
          quantity:   l.qty,
          unitPrice:  l.product.sale_price,
          subtotal:   (parseFloat(l.product.sale_price) * l.qty).toFixed(2),
        })),
      });
      setCart([]); loadSession(); loadStats();
    } catch { /* show error */ }
    finally { setCheckingOut(false); }
  }

  if (!session) {
    return (
      <div className="p-6 space-y-6 max-w-lg mx-auto">
        <PageHeader title="Punto de Venta" />
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Ventas hoy', value: fmt(stats.totalSales) },
              { label: 'Transacciones', value: stats.salesCount },
              { label: 'Turnos', value: stats.sessionsCount },
            ].map((s) => (
              <Card key={s.label} className="p-4 text-center">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{s.value}</p>
              </Card>
            ))}
          </div>
        )}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Abrir turno de caja</h2>
          <div>
            <label className={labelClass}>Efectivo inicial (S/)</label>
            <input type="number" className={inputClass} value={openAmt} onChange={(e) => setOpenAmt(e.target.value)} placeholder="0.00" />
          </div>
          <Button onClick={openSession} disabled={loading || !openAmt}>
            {loading ? 'Abriendo...' : 'Abrir turno'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row overflow-hidden">
      {/* Panel izquierdo — búsqueda de productos */}
      <div className="flex flex-col w-full lg:w-3/5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Turno abierto · {new Date(session.openedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</h2>
          <button onClick={() => setShowClose(true)} className="text-xs text-red-500 hover:underline">Cerrar turno</button>
        </div>
        <input
          ref={searchRef}
          autoFocus
          type="search"
          className={inputClass}
          placeholder="Buscar producto por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {products.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {products.map((p) => (
              <button key={p.product_id} onClick={() => addToCart(p)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-left transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.product_description}</p>
                  <p className="text-xs text-slate-400 font-mono">{p.product_code} · Stock: {p.stock}</p>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm tabular-nums">{fmt(p.sale_price)}</span>
              </button>
            ))}
          </div>
        )}
        {search && products.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">Sin resultados para "{search}"</p>
        )}
        {!search && (
          <div className="text-center py-10 text-slate-300 dark:text-slate-700 text-4xl">🔍</div>
        )}
      </div>

      {/* Panel derecho — carrito */}
      <div className="flex flex-col w-full lg:w-2/5 bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-2">🛒</p>
              <p className="text-sm">Busca y agrega productos</p>
            </div>
          )}
          {cart.map((line) => (
            <div key={line.product.product_id} className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{line.product.product_description}</p>
                <p className="text-xs text-slate-400">{fmt(line.product.sale_price)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(line.product.product_id, line.qty - 1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">−</button>
                <span className="w-6 text-center text-sm font-bold">{line.qty}</span>
                <button onClick={() => updateQty(line.product.product_id, line.qty + 1)} className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">+</button>
              </div>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 tabular-nums w-20 text-right">
                {fmt(parseFloat(line.product.sale_price) * line.qty)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3 bg-white dark:bg-slate-950">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Base imponible</span><span>{fmt(subtotal - igvAmt)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>IGV (18%)</span><span>{fmt(igvAmt)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white">
              <span>TOTAL</span><span>{fmt(total)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {(['cash', 'card'] as const).map((m) => (
              <button key={m} onClick={() => setPayMethod(m)}
                className={`flex-1 rounded-xl py-2 text-sm font-semibold transition-colors ${payMethod === m ? 'bg-indigo-600 text-white' : 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {m === 'cash' ? '💵 Efectivo' : '💳 Tarjeta'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCart([])} disabled={cart.length === 0}>Vaciar</Button>
            <Button onClick={checkout} disabled={cart.length === 0 || checkingOut} className="flex-1">
              {checkingOut ? 'Procesando...' : `Cobrar ${fmt(total)}`}
            </Button>
          </div>
        </div>
      </div>

      {showClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg">Cerrar turno</h2>
            <p className="text-sm text-slate-500">Ventas del turno: <strong>{fmt(session.totalSales)}</strong></p>
            <div>
              <label className={labelClass}>Efectivo en caja al cierre (S/)</label>
              <input type="number" className={inputClass} value={closeAmt} onChange={(e) => setCloseAmt(e.target.value)} placeholder="0.00" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowClose(false)}>Cancelar</Button>
              <Button onClick={closeSession} disabled={loading}>Cerrar turno</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
