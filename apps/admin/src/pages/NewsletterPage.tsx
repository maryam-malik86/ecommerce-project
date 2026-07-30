import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import { toast } from 'sonner';

interface Subscriber {
  id: number; email: string; name?: string; is_active: boolean; subscribed_at: string;
}

interface TemplateBlock {
  id: string;
  type: 'header' | 'heading' | 'text' | 'button' | 'product' | 'footer';
  content: string;
  url?: string;
  subText?: string;
}

async function fetchSubscribers() {
  const { data } = await api.get('/marketing/newsletter/subscribers');
  return data.data as Subscriber[];
}

export default function NewsletterPage() {
  const [activeTab, setActiveTab] = useState<'subscribers' | 'builder'>('subscribers');
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sent, setSent] = useState(false);
  const [search, setSearch] = useState('');

  // Email Template Builder Blocks State
  const [blocks, setBlocks] = useState<TemplateBlock[]>([
    { id: '1', type: 'header', content: 'Special Summer Sale! ☀️', subText: 'StoreCo Commerce' },
    { id: '2', type: 'heading', content: 'Exclusive Discounts Just for You' },
    { id: '3', type: 'text', content: 'Explore our latest arrivals and get up to 30% off on premium noise-cancelling headphones and tech accessories.' },
    { id: '4', type: 'button', content: 'Shop Summer Collection →', url: 'https://storeco.com/products' },
    { id: '5', type: 'footer', content: '© 2026 StoreCo Inc. All rights reserved. You are receiving this because you subscribed to our newsletter.' },
  ]);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers'],
    queryFn: fetchSubscribers,
  });

  const broadcastMutation = useMutation({
    mutationFn: () => api.post('/marketing/newsletter/broadcast', { subject, body }),
    onSuccess: () => {
      setSent(true);
      setSubject('');
      setBody('');
      toast.success(`Newsletter broadcast sent to ${active.length} active subscribers!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    },
  });

  const active = (subscribers ?? []).filter((s) => s.is_active);
  const filtered = (subscribers ?? []).filter((s) =>
    !search ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Template Builder Helpers
  const addBlock = (type: TemplateBlock['type']) => {
    const newBlock: TemplateBlock = {
      id: Date.now().toString(),
      type,
      content:
        type === 'header' ? 'New Announcement' :
        type === 'heading' ? 'Catchy Headline' :
        type === 'text' ? 'Write your newsletter message content here...' :
        type === 'button' ? 'Click Here →' :
        type === 'product' ? 'Featured Product Title' :
        '© 2026 StoreCo Commerce',
      url: type === 'button' ? 'https://storeco.com' : undefined,
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, key: keyof TemplateBlock, value: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, [key]: value } : b)));
  };

  const generateTemplateHTML = () => {
    return blocks.map((b) => {
      if (b.type === 'header') {
        return `<div style="background:#7c3aed;color:#fff;padding:24px;text-align:center;border-radius:8px;">
          <h1 style="margin:0;font-size:24px;">${b.content}</h1>
          ${b.subText ? `<p style="margin:4px 0 0;opacity:0.8;font-size:14px;">${b.subText}</p>` : ''}
        </div>`;
      }
      if (b.type === 'heading') {
        return `<h2 style="font-size:20px;font-weight:bold;color:#111827;margin:20px 0 8px;">${b.content}</h2>`;
      }
      if (b.type === 'text') {
        return `<p style="font-size:14px;line-height:1.6;color:#374151;margin:8px 0 16px;">${b.content}</p>`;
      }
      if (b.type === 'button') {
        return `<div style="text-align:center;margin:20px 0;">
          <a href="${b.url || '#'}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">${b.content}</a>
        </div>`;
      }
      if (b.type === 'product') {
        return `<div style="border:1px solid #e5e7eb;padding:16px;border-radius:8px;margin:16px 0;display:flex;align-items:center;gap:16px;">
          <div>
            <h3 style="margin:0;font-size:16px;color:#111827;">${b.content}</h3>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Special deal starting from $49.99</p>
          </div>
        </div>`;
      }
      return `<div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px;text-align:center;font-size:12px;color:#9ca3af;">${b.content}</div>`;
    }).join('\n');
  };

  const importTemplateToBroadcast = () => {
    setBody(generateTemplateHTML());
    setActiveTab('subscribers');
    setBroadcastOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Newsletter & Email Marketing</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ui-fg-muted)' }}>
            Manage subscribers and design visual email marketing templates
          </p>
        </div>
        <button
          id="broadcast-btn"
          onClick={() => { setBroadcastOpen(true); setSent(false); }}
          className="btn-primary"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Send Broadcast
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--ui-border-base)' }}>
        <button
          onClick={() => setActiveTab('subscribers')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px"
          style={{
            borderColor: activeTab === 'subscribers' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'subscribers' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          Subscribers ({subscribers?.length ?? '…'})
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className="px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px flex items-center gap-1.5"
          style={{
            borderColor: activeTab === 'builder' ? 'var(--ui-accent)' : 'transparent',
            color: activeTab === 'builder' ? 'var(--ui-accent)' : 'var(--ui-fg-muted)',
          }}
        >
          <span>Visual Template Builder</span>
          <span className="badge badge-purple text-2xs">PRO</span>
        </button>
      </div>

      {/* Tab 1: Subscribers List */}
      {activeTab === 'subscribers' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>Total Subscribers</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ui-fg-base)' }}>
                {isLoading ? '…' : (subscribers?.length ?? 0)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>Active</p>
              <p className="text-2xl font-bold mt-1" style={{ color: '#16a34a' }}>
                {isLoading ? '…' : active.length}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs" style={{ color: 'var(--ui-fg-muted)' }}>Unsubscribed</p>
              <p className="text-2xl font-bold mt-1" style={{ color: 'var(--ui-fg-muted)' }}>
                {isLoading ? '…' : (subscribers?.length ?? 0) - active.length}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="card p-3">
            <div className="relative">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                   className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ui-fg-muted)' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                id="subscriber-search"
                className="input pl-9"
                placeholder="Search subscribers by email or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            {isLoading ? (
              <TableSkeleton rows={6} cols={4} />
            ) : !filtered.length ? (
              <div className="py-12 text-center text-sm" style={{ color: 'var(--ui-fg-muted)' }}>
                No subscribers found
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Subscribed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((sub) => (
                      <tr key={sub.id}>
                        <td style={{ color: 'var(--ui-fg-muted)' }}>{sub.id}</td>
                        <td className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>{sub.email}</td>
                        <td style={{ color: 'var(--ui-fg-subtle)' }}>{sub.name ?? '—'}</td>
                        <td>
                          <span className={`badge ${sub.is_active ? 'badge-green' : 'badge-neutral'}`}>
                            {sub.is_active ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--ui-fg-muted)' }}>
                          {new Date(sub.subscribed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 2: Visual Email Template Builder */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls / Blocks Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ui-fg-muted)' }}>
                  Add Content Blocks
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => addBlock('header')} className="btn-secondary text-xs py-1 px-2.5">+ Header Banner</button>
                <button onClick={() => addBlock('heading')} className="btn-secondary text-xs py-1 px-2.5">+ Heading</button>
                <button onClick={() => addBlock('text')} className="btn-secondary text-xs py-1 px-2.5">+ Paragraph</button>
                <button onClick={() => addBlock('button')} className="btn-secondary text-xs py-1 px-2.5">+ CTA Button</button>
                <button onClick={() => addBlock('product')} className="btn-secondary text-xs py-1 px-2.5">+ Product Highlight</button>
                <button onClick={() => addBlock('footer')} className="btn-secondary text-xs py-1 px-2.5">+ Footer</button>
              </div>
            </div>

            {/* Block List Editor */}
            <div className="space-y-3">
              {blocks.map((b, idx) => (
                <div key={b.id} className="card p-4 space-y-3 border-l-4" style={{ borderLeftColor: 'var(--ui-accent)' }}>
                  <div className="flex items-center justify-between">
                    <span className="badge badge-purple uppercase text-2xs">{idx + 1}. {b.type}</span>
                    <button onClick={() => removeBlock(b.id)} className="btn-ghost text-xs p-1 text-red-500">Remove</button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Text / Content</label>
                    {b.type === 'text' ? (
                      <textarea
                        className="textarea"
                        rows={2}
                        value={b.content}
                        onChange={(e) => updateBlock(b.id, 'content', e.target.value)}
                      />
                    ) : (
                      <input
                        className="input"
                        value={b.content}
                        onChange={(e) => updateBlock(b.id, 'content', e.target.value)}
                      />
                    )}
                  </div>
                  {b.type === 'button' && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ui-fg-subtle)' }}>Button URL</label>
                      <input
                        className="input"
                        value={b.url ?? ''}
                        onChange={(e) => updateBlock(b.id, 'url', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={importTemplateToBroadcast} className="btn-primary w-full py-2.5 font-semibold">
              Use Template in Broadcast →
            </button>
          </div>

          {/* Live Preview Canvas (5 cols) */}
          <div className="lg:col-span-5 space-y-3 sticky top-6">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--ui-fg-muted)' }}>
                Live Canvas Preview
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`btn-secondary text-2xs py-0.5 px-2 ${previewDevice === 'desktop' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : ''}`}
                >
                  Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`btn-secondary text-2xs py-0.5 px-2 ${previewDevice === 'mobile' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : ''}`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Email Preview Frame */}
            <div
              className={`card p-4 mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-xs' : 'w-full'}`}
              style={{ background: '#ffffff', minHeight: '380px' }}
            >
              <div dangerouslySetInnerHTML={{ __html: generateTemplateHTML() }} />
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      <Modal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Send Broadcast Email"
        size="md"
        footer={
          sent ? (
            <button className="btn-primary" onClick={() => setBroadcastOpen(false)}>Done</button>
          ) : (
            <>
              <button className="btn-secondary" onClick={() => setBroadcastOpen(false)}>Cancel</button>
              <button
                id="send-broadcast"
                className="btn-primary"
                disabled={broadcastMutation.isPending || !subject.trim() || !body.trim()}
                onClick={() => broadcastMutation.mutate()}
              >
                {broadcastMutation.isPending ? 'Sending…' : `Send to ${active.length} subscribers`}
              </button>
            </>
          )
        }
      >
        {sent ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="font-semibold" style={{ color: 'var(--ui-fg-base)' }}>Broadcast sent successfully!</p>
            <p className="text-sm text-center" style={{ color: 'var(--ui-fg-muted)' }}>
              Your email was sent to {active.length} active subscribers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--ui-bg-subtle)', color: 'var(--ui-fg-muted)' }}>
              Sending to <strong style={{ color: 'var(--ui-fg-base)' }}>{active.length} active subscribers</strong>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ui-fg-subtle)' }}>Subject *</label>
              <input
                id="broadcast-subject"
                className="input"
                placeholder="Announcement subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--ui-fg-subtle)' }}>Message Body (HTML / Text) *</label>
              <textarea
                id="broadcast-body"
                className="textarea font-mono text-xs"
                rows={8}
                placeholder="Write your email body or import from Template Builder..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
