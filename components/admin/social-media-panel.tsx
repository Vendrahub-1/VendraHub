'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Platform = {
  platform_code: string; platform_name: string; platform_category: string;
  connection_method: string; publishing_capability: string; official_url: string;
  integration_notes: string; enabled: boolean;
};
type SocialAccount = { id: string; platform_code: string; account_label: string; connection_status: string };
type Post = {
  id: string; platform_code: string; title: string | null; caption: string;
  content_type: string; media_urls: string[]; status: string; created_at: string;
};

const categoryNames: Record<string,string> = {
  organic_social: 'Social publishing', messaging: 'Messaging',
  website_publishing: 'Website publishing', paid_advertising: 'Paid advertising',
  analytics: 'Analytics'
};

export default function SocialMediaPanel() {
  const [platforms,setPlatforms] = useState<Platform[]>([]);
  const [accounts,setAccounts] = useState<SocialAccount[]>([]);
  const [posts,setPosts] = useState<Post[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState<string|null>(null);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const supabase = createClient();
    const [p,a,q] = await Promise.all([
      supabase.from('social_platform_registry').select('*').eq('enabled',true).order('platform_category').order('platform_name'),
      supabase.from('social_platform_accounts').select('id,platform_code,account_label,connection_status'),
      supabase.from('social_content_posts').select('id,platform_code,title,caption,content_type,media_urls,status,created_at').eq('status','pending_approval').order('created_at',{ascending:true})
    ]);
    if(p.error || a.error || q.error) setError(p.error?.message ?? a.error?.message ?? q.error?.message ?? 'Could not load social workspace.');
    setPlatforms(p.data ?? []); setAccounts(a.data ?? []); setPosts(q.data ?? []);
    setLoading(false);
  },[]);

  useEffect(()=>{ void load(); },[load]);

  async function decide(post: Post, decision: 'approved'|'rejected') {
    setBusy(post.id); setError(''); setNotice('');
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user) { setError('Your owner session has expired. Sign in again.'); setBusy(null); return; }
    const update=await supabase.from('social_content_posts').update({
      status: decision, approved_by: decision==='approved' ? user.id : null,
      approved_at: decision==='approved' ? new Date().toISOString() : null,
      rejection_reason: decision==='rejected' ? 'Rejected by owner during content review' : null,
      updated_at: new Date().toISOString()
    }).eq('id',post.id).eq('status','pending_approval').select('id').maybeSingle();
    if(update.error || !update.data) {
      setError(update.error?.message ?? 'The post was changed or is no longer awaiting approval.');
      setBusy(null); return;
    }
    const audit=await supabase.from('social_post_approval_events').insert({
      post_id:post.id,decision,reviewer_id:user.id,
      reviewer_note: decision==='approved' ? 'Approved by owner' : 'Rejected by owner'
    });
    if(audit.error) setError('Decision saved, but the approval audit event could not be written: '+audit.error.message);
    else setNotice(decision==='approved' ? 'Approved. This does not publish the post; scheduling and publishing are separate steps.' : 'Rejected. This post will not be published.');
    await load(); setBusy(null);
  }

  const accountFor=(code:string)=>accounts.filter(a=>a.platform_code===code);
  const groups=['organic_social','messaging','website_publishing','paid_advertising','analytics'];
  return <div className="social-manager">
    <div className="social-policy">
      <div><strong>Owner approval is mandatory</strong><p>AI drafts stay private. A post cannot enter the publishing queue until you approve that exact platform version. Rejecting a post prevents publication.</p></div>
      <span className="state state-warning">APPROVAL GATE</span>
    </div>
    <div className="social-summary">
      <article><span>Platforms listed</span><strong>{platforms.length}</strong></article>
      <article><span>Accounts connected</span><strong>{accounts.filter(a=>a.connection_status==='connected').length}</strong></article>
      <article><span>Awaiting your review</span><strong>{posts.length}</strong></article>
      <article><span>Posting target</span><strong>1 / day / channel</strong></article>
    </div>
    {error && <p className="social-error" role="alert">{error}</p>}
    {notice && <p className="social-notice" role="status">{notice}</p>}
    <div className="social-review">
      <div className="card-heading"><div><h3>Content approval queue</h3><p>Review the actual wording and media for each channel separately.</p></div><button type="button" className="supplier-refresh" onClick={()=>void load()} disabled={loading||busy!==null}>Refresh</button></div>
      {loading ? <p className="social-empty">Loading approval queue…</p> : posts.length===0 ? <p className="social-empty">No posts are waiting for approval. AI content generation and scheduling are not activated yet.</p> :
        posts.map(post=><article className="social-post-review" key={post.id}>
          <div className="social-post-meta"><strong>{platforms.find(p=>p.platform_code===post.platform_code)?.platform_name ?? post.platform_code}</strong><span>{post.content_type.replaceAll('_',' ')}</span></div>
          {post.title && <strong>{post.title}</strong>}
          <p>{post.caption}</p>
          <small>{new Date(post.created_at).toLocaleString()}</small>
          <div className="social-post-actions">
            <button type="button" className="supplier-action" disabled={busy!==null} onClick={()=>void decide(post,'approved')}>{busy===post.id?'Saving…':'Approve this post'}</button>
            <button type="button" className="social-reject" disabled={busy!==null} onClick={()=>void decide(post,'rejected')}>Reject</button>
          </div>
        </article>)
      }
    </div>
    <div className="social-platforms">
      {groups.map(group=>{
        const items=platforms.filter(p=>p.platform_category===group);
        if(!items.length) return null;
        return <section className="social-platform-group" key={group}>
          <div className="card-heading"><div><h3>{categoryNames[group]}</h3><p>Connect only the official account owned or administered by VendraHub.</p></div></div>
          <div className="social-platform-grid">
            {items.map(platform=>{
              const linked=accountFor(platform.platform_code);
              return <article className="social-platform-card" key={platform.platform_code}>
                <div className="social-platform-head"><strong>{platform.platform_name}</strong><span className="state">{linked.some(a=>a.connection_status==='connected')?'Connected':linked.length?'Authorisation pending':'Not connected'}</span></div>
                <p>{platform.integration_notes}</p>
                <small>{platform.connection_method}</small>
                <div className="social-platform-foot"><span>{platform.publishing_capability.replaceAll('_',' ')}</span><a href={platform.official_url} target="_blank" rel="noreferrer">Official app / site ↗</a></div>
              </article>
            })}
          </div>
        </section>
      })}
    </div>
    <p className="social-disclaimer">Account registration and OAuth consent must be completed by the account owner. This registry does not create accounts or store provider passwords. Paid advertising accounts and budgets remain disabled until separately authorised.</p>
  </div>;
}
