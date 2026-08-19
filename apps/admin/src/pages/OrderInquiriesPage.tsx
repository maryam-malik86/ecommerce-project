import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import {
  MessageSquare, Clock, AlertTriangle, CheckCircle2,
  Search, ChevronLeft, ChevronRight, Eye, Send, Plus,
  User, Mail, ShoppingBag, X, ShieldAlert, Sparkles, Briefcase, HelpCircle
} from 'lucide-react';

interface InquiryReply {
  id: number;
  inquiry_id: number;
  sender_type: 'customer' | 'admin';
  sender_id?: number | null;
  sender_name: string;
  message: string;
  created_at: string;
}

interface OrderInquiry {
  id: number;
  inquiry_number: string;
  order_id?: number | null;
  user_id?: number | null;
  customer_name: string;
  customer_email: string;
  subject: string;
  category: 'general' | 'sales' | 'product_question' | 'shipping' | 'cancellation' | 'return_refund' | 'billing' | 'partnership' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';
  message: string;
  created_at: string;
  updated_at: string;
  order_number?: string | null;
  replies?: InquiryReply[];
}

const CATEGORIES = [
  { id: 'general', label: '💬 General Client Query' },
  { id: 'sales', label: '💼 Sales & Pre-Purchase' },
  { id: 'product_question', label: '🛍️ Product Question' },
  { id: 'shipping', label: '📦 Shipping & Delivery' },
  { id: 'cancellation', label: '🚫 Order Cancellation' },
  { id: 'return_refund', label: '🔄 Return & Refund' },
  { id: 'billing', label: '💳 Billing & Payment' },
  { id: 'partnership', label: '🤝 Partnership / B2B' },
  { id: 'other', label: '📌 Other' },
];

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'];

const QUICK_REPLIES = [
  'Thank you for reaching out to StoreCo! We have received your query and our client support representative is reviewing your details.',
  'Thank you for your interest in our products! We have answered your question below and attached relevant details.',
  'Your request regarding your order has been processed. Please let us know if you need any additional information!',
  'Thank you for contacting our sales team. A specialist will follow up with your business requirements shortly.',
];

async function fetchInquiries(paramsObj: Record<string, string>) {
  const params = new URLSearchParams(paramsObj);
  const { data } = await api.get(`/order-inquiries?${params.toString()}`);
  return {
    inquiries: (data.data || []) as OrderInquiry[],
    pagination: data.pagination || { page: 1, limit: 50, total: 0, total_pages: 1 },
  };
}

async function fetchSingleInquiry(id: number) {
  const { data } = await api.get(`/order-inquiries/${id}`);
  return data.data as OrderInquiry;
}

export default function OrderInquiriesPage() {
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();

  // Filters & State
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Drawer / Thread modal state
  const [activeInquiryId, setActiveInquiryId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  // Form state for creating manual inquiry
  const [newInquiry, setNewInquiry] = useState({
    customer_name: '',
    customer_email: '',
    order_id: '',
    subject: '',
    category: 'general',
    priority: 'medium',
    message: '',
  });

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      limit: String(limit),
    };
    if (statusFilter) p['status'] = statusFilter;
    if (categoryFilter) p['category'] = categoryFilter;
    if (priorityFilter) p['priority'] = priorityFilter;
    if (search) p['search'] = search;
    return p;
  }, [page, limit, statusFilter, categoryFilter, priorityFilter, search]);

  const { data, isLoading } = useQuery({
    queryKey: ['order-inquiries', queryParams],
    queryFn: () => fetchInquiries(queryParams),
  });

  const { data: activeInquiry, isLoading: isActiveLoading } = useQuery({
    queryKey: ['order-inquiry-detail', activeInquiryId],
    queryFn: () => fetchSingleInquiry(activeInquiryId!),
    enabled: activeInquiryId !== null,
  });

  const inquiries = data?.inquiries || [];
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, total_pages: 1 };

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = pagination.total || inquiries.length;
    const openCount = inquiries.filter((i) => i.status === 'open').length;
    const generalSalesCount = inquiries.filter((i) => i.category === 'general' || i.category === 'sales' || i.category === 'partnership').length;
    const urgentCount = inquiries.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;
    const resolvedCount = inquiries.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

    return { totalCount, openCount, generalSalesCount, urgentCount, resolvedCount };
  }, [inquiries, pagination.total]);

  // Mutations
  const replyMutation = useMutation({
    mutationFn: ({ id, message }: { id: number; message: string }) =>
      api.post(`/order-inquiries/${id}/replies`, { message, sender_type: 'admin' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-inquiry-detail', activeInquiryId] });
      qc.invalidateQueries({ queryKey: ['order-inquiries'] });
      setReplyMessage('');
      toast.success('Response sent to client');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, priority }: { id: number; status?: string; priority?: string }) =>
      api.patch(`/order-inquiries/${id}/status`, { status, priority }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-inquiry-detail', activeInquiryId] });
      qc.invalidateQueries({ queryKey: ['order-inquiries'] });
      toast.success('Client inquiry updated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update status');
    },
  });

  const createInquiryMutation = useMutation({
    mutationFn: (body: object) => api.post('/order-inquiries', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-inquiries'] });
      setCreateOpen(false);
      setNewInquiry({
        customer_name: '',
        customer_email: '',
        order_id: '',
        subject: '',
        category: 'general',
        priority: 'medium',
        message: '',
      });
      toast.success('New client query logged');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create inquiry');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInquiryMutation.mutate({
      ...newInquiry,
      order_id: newInquiry.order_id ? Number(newInquiry.order_id) : undefined,
    });
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 uppercase">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-2xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 uppercase">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-2xs font-medium rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 uppercase">Medium</span>;
      default:
        return <span className="px-2 py-0.5 text-2xs font-medium rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 uppercase">Low</span>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return <span className="px-2.5 py-1 text-2xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 text-2xs font-bold rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">In Progress</span>;
      case 'waiting_on_customer':
        return <span className="px-2.5 py-1 text-2xs font-semibold rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">Waiting Client</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 text-2xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 text-2xs font-medium rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">Closed</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Client Inquiries & Support
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Track, manage, and respond to general client queries, sales leads, product questions, and customer support tickets.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Log Client Inquiry
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Queries */}
        <div
          onClick={() => { setStatusFilter(''); setCategoryFilter(''); setPage(1); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === '' && categoryFilter === ''
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Total Queries</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metrics.totalCount}</div>
            <p className="text-2xs text-indigo-600 font-semibold mt-1">All Received Queries</p>
          </div>
        </div>

        {/* Card 2: General & Sales Leads */}
        <div
          onClick={() => { setCategoryFilter(categoryFilter === 'sales' ? '' : 'sales'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            categoryFilter === 'sales' || categoryFilter === 'general'
              ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/40 dark:bg-purple-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-purple-600">Sales & General</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metrics.generalSalesCount}</div>
            <p className="text-2xs text-purple-600 font-semibold mt-1">Pre-Purchase Leads</p>
          </div>
        </div>

        {/* Card 3: Action Needed (Open) */}
        <div
          onClick={() => { setStatusFilter(statusFilter === 'open' ? '' : 'open'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'open'
              ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-amber-600">Action Needed</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metrics.openCount}</div>
            <p className="text-2xs text-amber-600 font-semibold mt-1">Unanswered Queries</p>
          </div>
        </div>

        {/* Card 4: Urgent Priority */}
        <div
          onClick={() => { setPriorityFilter(priorityFilter === 'urgent' ? '' : 'urgent'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            priorityFilter === 'urgent'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-rose-600">Urgent Priority</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metrics.urgentCount}</div>
            <p className="text-2xs text-rose-600 font-semibold mt-1">High Priority Client Queries</p>
          </div>
        </div>

        {/* Card 5: Resolved */}
        <div
          onClick={() => { setStatusFilter(statusFilter === 'resolved' ? '' : 'resolved'); setPage(1); }}
          className={`cursor-pointer p-4 rounded-2xl border transition-all ${
            statusFilter === 'resolved'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20'
              : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-emerald-600">Resolved</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{metrics.resolvedCount}</div>
            <p className="text-2xs text-emerald-600 font-semibold mt-1">Answered & Closed</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search inquiry #, subject, client name, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((st) => (
              <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((pr) => (
              <option key={pr} value={pr}>{pr.toUpperCase()}</option>
            ))}
          </select>

          {(statusFilter || categoryFilter || priorityFilter || search) && (
            <button
              onClick={() => { setStatusFilter(''); setCategoryFilter(''); setPriorityFilter(''); setSearch(''); setPage(1); }}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : !inquiries.length ? (
          <EmptyState
            title="No client inquiries found"
            description="No client queries match your criteria. You can log a new client query or adjust filters."
            action={<button onClick={() => setCreateOpen(true)} className="btn-primary">Log Client Inquiry</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                  <th className="px-4 py-3.5">Query Ref</th>
                  <th className="px-4 py-3.5">Client Contact</th>
                  <th className="px-4 py-3.5">Subject & Category</th>
                  <th className="px-4 py-3.5">Order Ref</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-xs">
                {inquiries.map((inq) => (
                  <tr
                    key={inq.id}
                    onClick={() => setActiveInquiryId(inq.id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inq.inquiry_number}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-white">{inq.customer_name}</div>
                      <div className="text-2xs font-mono text-slate-400">{inq.customer_email}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{inq.subject}</p>
                      <span className="text-2xs text-slate-500 capitalize">{inq.category.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      {inq.order_id ? (
                        <Link
                          to={`/orders/${inq.order_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3 h-3" /> #{inq.order_id}
                        </Link>
                      ) : (
                        <span className="text-2xs text-slate-400">General Query</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">{getPriorityBadge(inq.priority)}</td>
                    <td className="px-4 py-3.5">{getStatusBadge(inq.status)}</td>
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveInquiryId(inq.id)}
                        className="px-3 py-1.5 text-2xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> View / Respond
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{Math.min(page * limit, pagination.total)}</span> of{' '}
              <span className="font-semibold text-slate-900 dark:text-white">{pagination.total}</span> client queries
            </div>

            <div className="flex items-center gap-3">
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white"
              >
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold text-slate-900 dark:text-white">{page} / {pagination.total_pages || 1}</span>
                <button
                  disabled={page >= (pagination.total_pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Thread Modal / Drawer */}
      <Modal
        isOpen={activeInquiryId !== null}
        onClose={() => setActiveInquiryId(null)}
        title={`Client Inquiry Thread — ${activeInquiry?.inquiry_number || ''}`}
        size="lg"
        footer={
          <button className="btn-secondary" onClick={() => setActiveInquiryId(null)}>Close</button>
        }
      >
        {isActiveLoading || !activeInquiry ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading inquiry conversation…</div>
        ) : (
          <div className="space-y-5">
            {/* Header info bar */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeInquiry.subject}</h3>
                  <p className="text-2xs text-slate-500 mt-0.5">
                    Category: <span className="font-semibold capitalize text-slate-700 dark:text-zinc-300">{activeInquiry.category.replace('_', ' ')}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={activeInquiry.status}
                    onChange={(e) => updateStatusMutation.mutate({ id: activeInquiry.id, status: e.target.value })}
                    className="select py-1 px-2.5 text-2xs font-bold"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{st.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>

                  <select
                    value={activeInquiry.priority}
                    onChange={(e) => updateStatusMutation.mutate({ id: activeInquiry.id, priority: e.target.value })}
                    className="select py-1 px-2.5 text-2xs font-bold"
                  >
                    {PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>Priority: {pr.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-200 dark:border-zinc-700/60">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-zinc-300">
                  <User className="w-3.5 h-3.5 text-indigo-500" /> {activeInquiry.customer_name}
                </span>
                <a href={`mailto:${activeInquiry.customer_email}`} className="flex items-center gap-1 text-slate-500 font-mono text-2xs hover:text-indigo-600">
                  <Mail className="w-3.5 h-3.5" /> {activeInquiry.customer_email}
                </a>
                {activeInquiry.order_id ? (
                  <Link
                    to={`/orders/${activeInquiry.order_id}`}
                    className="flex items-center gap-1 font-mono font-bold text-indigo-600 hover:underline ml-auto text-2xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Linked Order #{activeInquiry.order_id}
                  </Link>
                ) : (
                  <span className="text-2xs text-slate-400 ml-auto">General Client Inquiry</span>
                )}
              </div>
            </div>

            {/* Conversation Messages Timeline */}
            <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
              {/* Original Customer Message */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-xs space-y-1.5 border border-slate-200 dark:border-zinc-700">
                <div className="flex items-center justify-between text-2xs text-slate-500 font-semibold">
                  <span>Client Original Submission ({activeInquiry.customer_name})</span>
                  <span>{new Date(activeInquiry.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-800 dark:text-zinc-200 whitespace-pre-line leading-relaxed">
                  {activeInquiry.message}
                </p>
              </div>

              {/* Replies Thread */}
              {(activeInquiry.replies ?? []).map((reply) => {
                const isAdmin = reply.sender_type === 'admin';
                return (
                  <div
                    key={reply.id}
                    className={`p-3.5 rounded-2xl text-xs space-y-1.5 border ${
                      isAdmin
                        ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60 ml-4'
                        : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-2xs font-semibold">
                      <span className={isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}>
                        {reply.sender_name} ({reply.sender_type.toUpperCase()})
                      </span>
                      <span className="text-slate-400">{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-900 dark:text-white whitespace-pre-line leading-relaxed">
                      {reply.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer Box */}
            <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Quick Response Templates
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setReplyMessage(tpl)}
                    className="px-2.5 py-1 text-2xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-zinc-300 transition-colors text-left truncate max-w-xs"
                  >
                    Template #{i + 1}
                  </button>
                ))}
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Type your response to the client…"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  disabled={!replyMessage.trim() || replyMutation.isPending}
                  onClick={() => replyMutation.mutate({ id: activeInquiry.id, message: replyMessage })}
                  className="absolute right-2.5 bottom-3.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" /> Send Response
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Create Inquiry Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Log Client Inquiry / Contact Submission"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button
              form="create-inquiry-form"
              type="submit"
              className="btn-primary"
              disabled={createInquiryMutation.isPending}
            >
              {createInquiryMutation.isPending ? 'Logging…' : 'Log Inquiry'}
            </button>
          </>
        }
      >
        <form id="create-inquiry-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Client Name *</label>
              <input
                required
                className="input text-xs"
                placeholder="Client / Lead Name"
                value={newInquiry.customer_name}
                onChange={(e) => setNewInquiry({ ...newInquiry, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Client Email *</label>
              <input
                required
                type="email"
                className="input text-xs"
                placeholder="client@example.com"
                value={newInquiry.customer_email}
                onChange={(e) => setNewInquiry({ ...newInquiry, customer_email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Inquiry Category *</label>
              <select
                className="select text-xs"
                value={newInquiry.category}
                onChange={(e) => setNewInquiry({ ...newInquiry, category: e.target.value as any })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Priority</label>
              <select
                className="select text-xs"
                value={newInquiry.priority}
                onChange={(e) => setNewInquiry({ ...newInquiry, priority: e.target.value as any })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Linked Order ID (Optional)</label>
            <input
              type="number"
              className="input text-xs"
              placeholder="e.g. 1 (Leave empty for general client queries)"
              value={newInquiry.order_id}
              onChange={(e) => setNewInquiry({ ...newInquiry, order_id: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Subject *</label>
            <input
              required
              className="input text-xs"
              placeholder="Summary of client query or request…"
              value={newInquiry.subject}
              onChange={(e) => setNewInquiry({ ...newInquiry, subject: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-zinc-300">Client Query Details *</label>
            <textarea
              required
              rows={3}
              className="input text-xs"
              placeholder="Full details of client message or contact submission…"
              value={newInquiry.message}
              onChange={(e) => setNewInquiry({ ...newInquiry, message: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
