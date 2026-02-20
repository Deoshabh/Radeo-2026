'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '@/utils/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  FiArrowLeft, FiSend, FiBell, FiUser, FiUsers, FiMapPin,
  FiShoppingCart, FiClock, FiSearch, FiImage, FiX, FiChevronDown,
  FiCheck, FiAlertTriangle, FiExternalLink, FiEye,
} from 'react-icons/fi';

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users', icon: FiUsers, desc: 'Every registered user' },
  { value: 'user', label: 'Specific User', icon: FiUser, desc: 'Search by name/email/phone' },
  { value: 'city', label: 'By City', icon: FiMapPin, desc: 'Target users in specific cities' },
  { value: 'cart_abandonners', label: 'Cart Abandoners', icon: FiShoppingCart, desc: 'Users with items in cart' },
  { value: 'inactive', label: 'Inactive 30+ Days', icon: FiClock, desc: 'Win-back inactive users' },
];

const NAV_OPTIONS = [
  { value: 'none', label: 'No Navigation' },
  { value: 'product', label: 'Open Product' },
  { value: 'category', label: 'Open Category' },
  { value: 'screen', label: 'Open Screen' },
];

export default function PushNotificationsPage() {
  const qc = useQueryClient();

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [navType, setNavType] = useState('none');
  const [navValue, setNavValue] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetUser, setTargetUser] = useState(null);
  const [targetCities, setTargetCities] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [showCityDrop, setShowCityDrop] = useState(false);
  const searchTimer = useRef(null);

  // ── Queries ──
  const historyQ = useQuery({
    queryKey: ['admin', 'app', 'notifications'],
    queryFn: async () => { const r = await adminAPI.getNotificationHistory(); return r.data?.data ?? r.data; },
    staleTime: 60_000,
  });

  const targetCountQ = useQuery({
    queryKey: ['admin', 'app', 'targetCount', targetType, targetUser?._id, targetCities.join(',')],
    queryFn: async () => {
      const p = { targetType };
      if (targetType === 'user' && targetUser) p.userId = targetUser._id;
      if (targetType === 'city') p.cities = targetCities;
      const r = await adminAPI.getNotificationTargetCount(p);
      return r.data?.data?.count ?? r.data?.count ?? 0;
    },
    enabled: targetType === 'all' || targetType === 'cart_abandonners' || targetType === 'inactive' || (targetType === 'user' && !!targetUser) || (targetType === 'city' && targetCities.length > 0),
    staleTime: 30_000,
  });

  const citiesQ = useQuery({
    queryKey: ['admin', 'app', 'cities'],
    queryFn: async () => { const r = await adminAPI.getAppCities(); return r.data?.data ?? r.data ?? []; },
    staleTime: 300_000,
    enabled: targetType === 'city',
  });

  const [userResults, setUserResults] = useState([]);
  const [searchingUser, setSearchingUser] = useState(false);

  const searchUsers = (q) => {
    setUserQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setUserResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearchingUser(true);
      try {
        const r = await adminAPI.searchAppUsers(q);
        setUserResults(r.data?.data ?? r.data ?? []);
      } catch { setUserResults([]); }
      setSearchingUser(false);
    }, 400);
  };

  // ── Send ──
  const sendMut = useMutation({
    mutationFn: (payload) => adminAPI.sendAppNotification(payload),
    onSuccess: (res) => {
      const c = res.data?.data?.count ?? 0;
      toast.success(`Notification sent to ${c} user${c !== 1 ? 's' : ''}`);
      qc.invalidateQueries({ queryKey: ['admin', 'app', 'notifications'] });
      setTitle(''); setBody(''); setImageUrl(''); setNavType('none'); setNavValue('');
      setTargetType('all'); setTargetUser(null); setTargetCities([]); setShowConfirm(false);
    },
    onError: () => {
      toast.error('Failed to send notification');
      setShowConfirm(false);
    },
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const handleSend = () => {
    const payload = { title: title.trim(), body: body.trim(), targetType };
    if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
    if (navType !== 'none') payload.data = { type: navType, value: navValue };
    if (targetType === 'user' && targetUser) payload.userId = targetUser._id;
    if (targetType === 'city') payload.cities = targetCities;
    sendMut.mutate(payload);
  };

  const history = historyQ.data ?? [];

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/app" className="text-gray-400 hover:text-gray-600 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Push Notifications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Compose and send notifications, view history</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ─── Compose Form (2 cols) ─── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Content */}
            <Card title="Content">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                    <span className={`text-xs font-mono ${title.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>{title.length}/50</span>
                  </div>
                  <input type="text" maxLength={60} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Flash Sale — 50% off!" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Body</label>
                    <span className={`text-xs font-mono ${body.length > 150 ? 'text-red-500' : 'text-gray-400'}`}>{body.length}/150</span>
                  </div>
                  <textarea rows={3} maxLength={160} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Hurry! Limited time offer on all sneakers." />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FiImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="url" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
                    </div>
                    {imageUrl && (
                      <img src={imageUrl} className="w-10 h-10 rounded-lg object-cover border" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Navigation */}
            <Card title="Tap Action">
              <div className="flex flex-wrap gap-2 mb-3">
                {NAV_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => { setNavType(opt.value); setNavValue(''); }} className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${navType === opt.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{opt.label}</button>
                ))}
              </div>
              {navType !== 'none' && (
                <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none" value={navValue} onChange={(e) => setNavValue(e.target.value)} placeholder={navType === 'product' ? 'Product ID or slug' : navType === 'category' ? 'Category slug' : 'Screen name (e.g. orders, wishlist)'} />
              )}
            </Card>

            {/* Target Audience */}
            <Card title="Target Audience">
              <div className="space-y-3">
                {TARGET_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const selected = targetType === opt.value;
                  return (
                    <button key={opt.value} onClick={() => { setTargetType(opt.value); setTargetUser(null); setTargetCities([]); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left border transition-all ${selected ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                      <Icon className={`w-4 h-4 ${selected ? 'text-gray-900' : 'text-gray-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${selected ? 'text-gray-900' : 'text-gray-700'}`}>{opt.label}</div>
                        <div className="text-xs text-gray-400">{opt.desc}</div>
                      </div>
                      {selected && <FiCheck className="w-4 h-4 text-gray-900 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Specific user search */}
              {targetType === 'user' && (
                <div className="mt-4 space-y-2">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400" placeholder="Search name, email or phone..." value={userQuery} onChange={(e) => searchUsers(e.target.value)} />
                    {searchingUser && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>}
                  </div>
                  {targetUser && (
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
                      <FiUser className="w-3.5 h-3.5 text-gray-500" />
                      <span className="font-medium text-gray-800">{targetUser.name}</span>
                      <span className="text-gray-400 text-xs">{targetUser.email}</span>
                      <button onClick={() => setTargetUser(null)} className="ml-auto text-gray-400 hover:text-red-500"><FiX className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {userResults.length > 0 && !targetUser && (
                    <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto divide-y">
                      {userResults.map((u) => (
                        <button key={u._id} onClick={() => { setTargetUser(u); setUserResults([]); setUserQuery(''); }} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 text-sm">
                          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">{(u.name || '?')[0]}</div>
                          <div className="flex-1 min-w-0 truncate"><span className="font-medium text-gray-800">{u.name}</span> <span className="text-gray-400 text-xs ml-1">{u.email}</span></div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* City multi-select */}
              {targetType === 'city' && (
                <div className="mt-4 space-y-2">
                  <div className="relative">
                    <button onClick={() => setShowCityDrop(!showCityDrop)} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 text-sm text-left hover:border-gray-300">
                      <span className={targetCities.length ? 'text-gray-800' : 'text-gray-400'}>{targetCities.length ? `${targetCities.length} cities selected` : 'Select cities...'}</span>
                      <FiChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCityDrop ? 'rotate-180' : ''}`} />
                    </button>
                    {showCityDrop && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                        {(citiesQ.data ?? []).map((city) => {
                          const sel = targetCities.includes(city);
                          return (
                            <button key={city} onClick={() => setTargetCities((prev) => sel ? prev.filter((c) => c !== city) : [...prev, city])} className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 text-left">
                              <span className={sel ? 'font-medium text-gray-900' : 'text-gray-600'}>{city}</span>
                              {sel && <FiCheck className="w-4 h-4 text-emerald-500" />}
                            </button>
                          );
                        })}
                        {citiesQ.isLoading && <div className="p-3 text-center text-xs text-gray-400">Loading...</div>}
                        {!citiesQ.isLoading && (citiesQ.data ?? []).length === 0 && <div className="p-3 text-center text-xs text-gray-400">No cities found</div>}
                      </div>
                    )}
                  </div>
                  {targetCities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {targetCities.map((c) => (
                        <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {c}
                          <button onClick={() => setTargetCities((prev) => prev.filter((x) => x !== c))} className="text-gray-400 hover:text-red-500"><FiX className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Target count */}
              {typeof targetCountQ.data === 'number' && (
                <div className="mt-4 flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2.5">
                  <FiUsers className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700 font-medium">{targetCountQ.data.toLocaleString()} user{targetCountQ.data !== 1 ? 's' : ''} will receive this notification</span>
                </div>
              )}
            </Card>

            {/* Send */}
            <div className="flex items-center gap-3 justify-end">
              <button
                disabled={!canSend || sendMut.isPending}
                onClick={() => setShowConfirm(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <FiSend className="w-4 h-4" /> Send Notification
              </button>
            </div>
          </div>

          {/* ─── Right Column: Preview + History ─── */}
          <div className="space-y-5">

            {/* Phone Preview */}
            <Card title="Preview">
              <div className="bg-gray-100 rounded-2xl p-4 mx-auto" style={{ maxWidth: 280 }}>
                {/* Notification card */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {imageUrl && (
                    <img src={imageUrl} className="w-full h-32 object-cover" alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                  )}
                  <div className="p-3">
                    <div className="flex items-start gap-2 mb-1">
                      <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FiBell className="w-3 h-3 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{title || 'Notification Title'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-3">{body || 'Notification body text appears here...'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">Radeo</span>
                      <span className="text-[10px] text-gray-400">now</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* History */}
            <Card title="Recent History">
              {historyQ.isLoading ? (
                <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No notifications sent yet</p>
              ) : (
                <div className="divide-y divide-gray-100 -mx-4">
                  {history.slice(0, 10).map((item, i) => (
                    <div key={i} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.title || item._id?.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{item.body || item._id?.body}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">{item.sentCount ?? item.count} sent</span>
                        {typeof item.openRate === 'number' && (
                          <span className="text-[10px] text-emerald-600 font-medium">{(item.openRate * 100).toFixed(0)}% opened</span>
                        )}
                        {item.sentAt && (
                          <span className="text-[10px] text-gray-400">{new Date(item.sentAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ─── Confirm Modal ─── */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <FiSend className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Send Notification?</h3>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-sm text-gray-600"><strong>Title:</strong> {title}</p>
                <p className="text-sm text-gray-600"><strong>Body:</strong> {body}</p>
                <p className="text-sm text-gray-600"><strong>Target:</strong> {TARGET_OPTIONS.find((o) => o.value === targetType)?.label}{targetType === 'user' && targetUser ? ` — ${targetUser.name}` : ''}{targetType === 'city' ? ` — ${targetCities.join(', ')}` : ''}</p>
                {typeof targetCountQ.data === 'number' && (
                  <p className="text-sm font-medium text-blue-600">{targetCountQ.data.toLocaleString()} recipient{targetCountQ.data !== 1 ? 's' : ''}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">Cancel</button>
                <button onClick={handleSend} disabled={sendMut.isPending} className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 transition-colors">
                  {sendMut.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSend className="w-4 h-4" />}
                  {sendMut.isPending ? 'Sending...' : 'Send Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {title && <div className="px-4 py-3 border-b border-gray-100"><h3 className="text-sm font-semibold text-gray-800">{title}</h3></div>}
      <div className="p-4">{children}</div>
    </div>
  );
}
