'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ProfileForm({ user }: { user: { name: string | null; email: string | null } }) {
  const router = useRouter();
  const [name, setName] = useState(user.name || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: 'Ma\'lumotlar muvaffaqiyatli saqlandi!' });
        router.refresh();
      } else {
        setMsg({ type: 'error', text: data.error || 'Xatolik yuz berdi' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Server bilan aloqa yo\'q' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdate} className="space-y-4">
      {msg && (
        <div className={`p-3 rounded-lg text-sm font-semibold ${msg.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-rose-900/30 text-rose-400 border border-rose-800'}`}>
          {msg.text}
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">To'liq Ism (F.I.Sh)</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Elektron Pochta</label>
        <input 
          type="email" 
          value={user.email || ''}
          disabled
          className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-500 text-sm cursor-not-allowed"
        />
        <p className="text-[10px] text-slate-500">Pochta manzilini o'zgartirish hozircha imkonsiz.</p>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading || name === user.name}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {loading ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
        </Button>
      </div>
    </form>
  );
}

export function DeleteAccountButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
      });
      if (res.ok) {
        window.location.href = '/auth/login';
      } else {
        alert('O\'chirishda xatolik yuz berdi.');
        setLoading(false);
        setConfirm(false);
      }
    } catch (err) {
      alert('Server bilan aloqa yo\'q');
      setLoading(false);
      setConfirm(false);
    }
  };

  return (
    <Button 
      variant="danger" 
      onClick={handleDelete} 
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      {confirm ? 'Haqiqatan ham o\'chirasizmi?' : 'Akkountni O\'chirish'}
    </Button>
  );
}
