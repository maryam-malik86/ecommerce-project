import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import { toast } from 'sonner';
import { Sliders, Globe, CreditCard, ShieldAlert, Save } from 'lucide-react';

interface StoreSettings {
  store_name: string;
  support_email: string;
  currency_symbol: string;
  currency_code: string;
  tax_rate: number;
  timezone: string;
  default_language?: string;
  date_format?: string;
  maintenance_mode: boolean;
  allow_registration: boolean;
  allow_guest_checkout: boolean;
  stripe_enabled: boolean;
  paypal_enabled: boolean;
  cod_enabled: boolean;
}

async function fetchSettings() {
  const { data } = await api.get('/settings');
  return data.data as StoreSettings;
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'localization' | 'features' | 'payments'>('profile');
  const [form, setForm] = useState<StoreSettings | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        ...settings,
        default_language: settings.default_language || 'en',
        date_format: settings.date_format || 'YYYY-MM-DD',
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body: object) => api.patch('/settings', body),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setForm((prev) => ({ ...prev!, ...res.data.data }));
      toast.success('System settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form) updateMutation.mutate(form);
  };

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            System & Website Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Configure dynamic store profile, localization & currency, feature switches, and payment gateways
          </p>
        </div>
        <button
          id="save-settings-btn"
          form="settings-form"
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={updateMutation.isPending}
        >
          <Save className="w-4 h-4" />
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800">
        {[
          { id: 'profile', label: 'Store Profile', icon: Sliders },
          { id: 'localization', label: 'Localization & Currency', icon: Globe },
          { id: 'features', label: 'System & Feature Flags', icon: ShieldAlert },
          { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all -mb-px ${isActive ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Store Profile Tab */}
        {activeTab === 'profile' && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
              General Store Info
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Support Email *</label>
                <input
                  type="email"
                  required
                  value={form.support_email}
                  onChange={(e) => setForm({ ...form, support_email: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Localization Tab */}
        {activeTab === 'localization' && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
              Regional & Language Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Currency Code</label>
                <select
                  value={form.currency_code}
                  onChange={(e) => {
                    const code = e.target.value;
                    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', PKR: 'Rs', AED: 'AED' };
                    setForm({ ...form, currency_code: code, currency_symbol: symbols[code] || '$' });
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="PKR">PKR (Rs) - Pakistani Rupee</option>
                  <option value="AED">AED (AED) - UAE Dirham</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={form.currency_symbol}
                  onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Default Store Language</label>
                <select
                  value={form.default_language}
                  onChange={(e) => setForm({ ...form, default_language: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="fr">French (Français)</option>
                  <option value="ur">Urdu (اردو)</option>
                  <option value="ar">Arabic (العربية)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
              System Feature Controls
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Maintenance Mode</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Temporarily disable public storefront access for maintenance</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.maintenance_mode}
                  onChange={(e) => setForm({ ...form, maintenance_mode: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Allow Public Registration</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Allow new customers to register accounts on storefront</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.allow_registration}
                  onChange={(e) => setForm({ ...form, allow_registration: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Allow Guest Checkout</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Let shoppers place orders without registering an account</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.allow_guest_checkout}
                  onChange={(e) => setForm({ ...form, allow_guest_checkout: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>
        )}

        {/* Payment Gateways Tab */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-2">
              Payment Gateway Switches
            </h2>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Stripe Payments</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Accept credit and debit card payments via Stripe</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.stripe_enabled}
                  onChange={(e) => setForm({ ...form, stripe_enabled: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">PayPal Integration</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Enable PayPal express checkout buttons</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.paypal_enabled}
                  onChange={(e) => setForm({ ...form, paypal_enabled: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">Cash on Delivery (COD)</p>
                  <p className="text-2xs text-slate-400 dark:text-zinc-500">Allow customers to pay cash upon order arrival</p>
                </div>
                <input
                  type="checkbox"
                  checked={form.cod_enabled}
                  onChange={(e) => setForm({ ...form, cod_enabled: e.target.checked })}
                  className="rounded border-slate-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
