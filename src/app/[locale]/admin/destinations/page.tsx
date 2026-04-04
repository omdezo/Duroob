'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, Search, Plus, Trash2, Pencil, X, Save, Loader2 } from 'lucide-react';
import type { Destination } from '@/types/destination';

type SortKey = 'name' | 'region' | 'cost' | 'crowd';

const CROWD_COLORS = ['','text-green-600','text-lime-600','text-yellow-600','text-orange-600','text-red-600'];
const REGION_AR: Record<string,string> = { muscat:'مسقط', dakhiliya:'الداخلية', sharqiya:'الشرقية', dhofar:'ظفار', batinah:'الباطنة', dhahira:'الظاهرة' };

export default function DestinationsPage() {
  const params = useParams();
  const locale = (params.locale as string) || 'en';
  const isRtl = locale === 'ar';

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [editDest, setEditDest] = useState<Destination|null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for add/edit
  const [form, setForm] = useState({
    id:'', nameEn:'', nameAr:'', region:'muscat',
    lat:'23.5', lng:'58.4', ticketCost:'0', crowdLevel:'3', visitMin:'60',
    categories: ['culture'] as string[],
    months: [1,2,3,10,11,12] as number[],
  });

  const toggleFormCat = (c: string) => setForm(f => ({
    ...f,
    categories: f.categories.includes(c) ? f.categories.filter(x => x !== c) : [...f.categories, c]
  }));

  const toggleMonth = (m: number) => setForm(f => ({
    ...f,
    months: f.months.includes(m) ? f.months.filter(x => x !== m) : [...f.months, m]
  }));

  useEffect(() => {
    fetch('/api/admin/destinations')
      .then(r => r.json())
      .then(d => { setDestinations(d.destinations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = destinations;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d => d.name.en.toLowerCase().includes(q) || d.name.ar.includes(search) || d.id.includes(q) || d.region.en.includes(q));
    }
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.en.localeCompare(b.name.en);
      if (sortKey === 'region') cmp = a.region.en.localeCompare(b.region.en);
      if (sortKey === 'cost') cmp = a.ticket_cost_omr - b.ticket_cost_omr;
      if (sortKey === 'crowd') cmp = a.crowd_level - b.crowd_level;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [destinations, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function openEdit(d: Destination) {
    setForm({
      id: d.id, nameEn: d.name.en, nameAr: d.name.ar, region: d.region.en,
      lat: String(d.lat), lng: String(d.lng), ticketCost: String(d.ticket_cost_omr),
      crowdLevel: String(d.crowd_level), visitMin: String(d.avg_visit_duration_minutes),
      categories: d.categories || ['culture'],
      months: d.recommended_months || [1,2,3,10,11,12],
    });
    setEditDest(d);
    setShowAdd(false);
  }

  function openAdd() {
    setForm({
      id: '', nameEn: '', nameAr: '', region: 'muscat',
      lat: '23.5', lng: '58.4', ticketCost: '0', crowdLevel: '3', visitMin: '60',
      categories: ['culture'], months: [1,2,3,10,11,12],
    });
    setEditDest(null);
    setShowAdd(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editDest) {
        // Update
        const res = await fetch(`/api/admin/destinations/${editDest.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: { en: form.nameEn, ar: form.nameAr },
            region: { en: form.region, ar: REGION_AR[form.region] || form.region },
            lat: parseFloat(form.lat), lng: parseFloat(form.lng),
            ticket_cost_omr: parseFloat(form.ticketCost),
            crowd_level: parseInt(form.crowdLevel),
            avg_visit_duration_minutes: parseInt(form.visitMin),
            categories: form.categories,
            recommended_months: form.months,
          }),
        });
        if (res.ok) {
          const { destination } = await res.json();
          setDestinations(prev => prev.map(d => d.id === editDest.id ? destination : d));
          setEditDest(null);
        }
      } else {
        // Create
        const id = form.id || `new-${Date.now()}`;
        const res = await fetch('/api/admin/destinations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            name: { en: form.nameEn, ar: form.nameAr },
            region: { en: form.region, ar: REGION_AR[form.region] || form.region },
            lat: parseFloat(form.lat), lng: parseFloat(form.lng),
            ticket_cost_omr: parseFloat(form.ticketCost),
            crowd_level: parseInt(form.crowdLevel),
            avg_visit_duration_minutes: parseInt(form.visitMin),
            categories: form.categories,
            company: { en: 'Tourism', ar: 'السياحة' },
            recommended_months: form.months,
          }),
        });
        if (res.ok) {
          const { destination } = await res.json();
          setDestinations(prev => [...prev, destination]);
          setShowAdd(false);
        }
      }
    } catch {} finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;
    const res = await fetch(`/api/admin/destinations/${id}`, { method: 'DELETE' });
    if (res.ok) setDestinations(prev => prev.filter(d => d.id !== id));
  }

  const showModal = showAdd || editDest;

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isRtl ? 'إدارة الوجهات' : 'Manage Destinations'}</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} {isRtl ? 'وجهة' : 'destinations'}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors">
          <Plus size={16} /> {isRtl ? 'إضافة وجهة' : 'Add Destination'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute top-1/2 -translate-y-1/2 start-3 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={isRtl ? 'ابحث...' : 'Search...'}
          className="w-full ps-10 pe-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-teal-400" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-3 text-start font-medium text-gray-500">ID</th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('name')}>
                    {isRtl ? 'الاسم' : 'Name'} {sortKey === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('region')}>
                    {isRtl ? 'المنطقة' : 'Region'} {sortKey === 'region' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('cost')}>
                    {isRtl ? 'التكلفة' : 'Cost'} {sortKey === 'cost' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('crowd')}>
                    {isRtl ? 'الازدحام' : 'Crowd'} {sortKey === 'crowd' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-start font-medium text-gray-500">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{d.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{isRtl ? d.name.ar : d.name.en}</p>
                      <p className="text-xs text-gray-400">{isRtl ? d.name.en : d.name.ar}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{isRtl ? (REGION_AR[d.region.en] || d.region.en) : d.region.en}</td>
                    <td className="px-4 py-3 text-sm">{d.ticket_cost_omr === 0 ? <span className="text-green-600 font-medium">{isRtl?'مجاني':'Free'}</span> : `${d.ticket_cost_omr} OMR`}</td>
                    <td className={`px-4 py-3 text-sm font-medium ${CROWD_COLORS[d.crowd_level]}`}>{d.crowd_level}/5</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition" aria-label="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" aria-label="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowAdd(false); setEditDest(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-bold text-gray-900">
                {editDest ? (isRtl ? 'تعديل الوجهة' : 'Edit Destination') : (isRtl ? 'إضافة وجهة جديدة' : 'Add New Destination')}
              </h2>
              <button onClick={() => { setShowAdd(false); setEditDest(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!editDest && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input value={form.id} onChange={e => setForm({...form, id: e.target.value})} placeholder="e.g., mct-007" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (EN)</label>
                  <input value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name (AR)</label>
                  <input value={form.nameAr} onChange={e => setForm({...form, nameAr: e.target.value})} dir="rtl" className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'المنطقة' : 'Region'}</label>
                <select value={form.region} onChange={e => setForm({...form, region: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400">
                  {Object.entries(REGION_AR).map(([en, ar]) => <option key={en} value={en}>{isRtl ? ar : en}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'التصنيفات' : 'Categories'}</label>
                <div className="flex flex-wrap gap-2">
                  {['mountain','beach','culture','desert','nature','food'].map(cat => (
                    <button key={cat} type="button" onClick={() => toggleFormCat(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm ${form.categories.includes(cat) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'الأشهر الموصى بها' : 'Recommended Months'}</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {Array.from({length:12},(_,i)=>i+1).map(m => (
                    <button key={m} type="button" onClick={() => toggleMonth(m)}
                      className={`py-2 rounded-lg text-xs ${form.months.includes(m) ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="0.0001" value={form.lat} onChange={e => setForm({...form, lat: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="0.0001" value={form.lng} onChange={e => setForm({...form, lng: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'التكلفة (ر.ع)' : 'Cost (OMR)'}</label>
                  <input type="number" step="0.5" value={form.ticketCost} onChange={e => setForm({...form, ticketCost: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'الازدحام (1-5)' : 'Crowd (1-5)'}</label>
                  <input type="number" min="1" max="5" value={form.crowdLevel} onChange={e => setForm({...form, crowdLevel: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isRtl ? 'مدة الزيارة (دقيقة)' : 'Visit (min)'}</label>
                  <input type="number" value={form.visitMin} onChange={e => setForm({...form, visitMin: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:border-teal-400" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex items-center justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setEditDest(null); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={handleSave} disabled={saving || !form.nameEn || !form.nameAr}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editDest ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
