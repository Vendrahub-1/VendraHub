import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function requireOwner(){
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user||user.email?.toLowerCase()!=='vendrahub@hotmail.com')return {response:json({error:'Owner access only.'},403)};
 const {data:assurance}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
 if(assurance?.currentLevel!=='aal2')return {response:json({error:'Authenticator verification required.'},403)};
 const [{data:profile},{data:roles}]=await Promise.all([
  supabase.from('admin_profiles').select('staff_status').eq('user_id',user.id).maybeSingle(),
  supabase.from('admin_role_assignments').select('role_code').eq('user_id',user.id)
 ]);
 if(profile?.staff_status!=='active'||!roles?.some(x=>x.role_code==='super_admin'))return {response:json({error:'Active super-admin access is required.'},403)};
 return {supabase,user};
}

import { NextRequest } from 'next/server';
const TYPES=['product_update','product_publish','order_fulfilment','order_cancellation','refund','inventory_adjustment','supplier_order','customer_account_change','support_reply','store_setting_change'];
export async function GET(){
 const auth=await requireOwner();if('response'in auth)return auth.response;
 const {data,error}=await auth.supabase.from('ai_approval_requests').select('id,action_type,resource_type,resource_id,summary,proposed_payload,risk_level,status,requested_by,reviewed_by,reviewed_at,review_note,created_at,updated_at').order('created_at',{ascending:false}).limit(100);
 if(error)return json({error:'Approval queue is not available. Apply the VendraHub AI approvals migration first.'},503);
 return json({requests:data});
}
export async function POST(request:NextRequest){
 const auth=await requireOwner();if('response'in auth)return auth.response;
 let b:unknown;try{b=await request.json()}catch{return json({error:'Valid JSON is required.'},400)}
 if(!b||typeof b!=='object')return json({error:'Invalid approval request.'},400);
 const x=b as Record<string,unknown>;
 if(typeof x.actionType!=='string'||!TYPES.includes(x.actionType)||typeof x.summary!=='string'||x.summary.trim().length<8||x.summary.length>500||!['low','medium','high','critical'].includes(String(x.riskLevel)))return json({error:'Valid action type, summary and risk level are required.'},400);
 if(x.resourceType!==undefined&&(typeof x.resourceType!=='string'||x.resourceType.length>80))return json({error:'Invalid resource type.'},400);
 if(x.resourceId!==undefined&&(typeof x.resourceId!=='string'||x.resourceId.length>255))return json({error:'Invalid resource ID.'},400);
 const payload=x.payload??{};if(!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>10000)return json({error:'Proposed payload must be a JSON object under 10KB.'},400);
 const {data,error}=await auth.supabase.from('ai_approval_requests').insert({action_type:x.actionType,resource_type:x.resourceType??null,resource_id:x.resourceId??null,summary:x.summary.trim(),proposed_payload:payload,risk_level:x.riskLevel,status:'pending',requested_by:auth.user.id}).select('id,action_type,summary,risk_level,status,created_at').single();
 if(error)return json({error:'Could not create approval request. Apply the approvals migration and retry.'},503);
 const audit=await auth.supabase.from('audit_events').insert({actor_id:auth.user.id,action:'ai_approval.requested',resource_type:'ai_approval_request',resource_id:data.id,outcome:'success',details:{action_type:x.actionType,risk_level:x.riskLevel}});
 if(audit.error)console.error('Approval request audit failed:',audit.error.message);
 return json({request:data,message:'Approval request created. No business action has been executed.'},201);
}
export async function PATCH(request:NextRequest){
 const auth=await requireOwner();if('response'in auth)return auth.response;
 let b:unknown;try{b=await request.json()}catch{return json({error:'Valid JSON is required.'},400)}
 const x=b as {id?:unknown;decision?:unknown;note?:unknown};
 if(typeof x.id!=='string'||!/^[0-9a-f-]{36}$/i.test(x.id)||!['approved','rejected'].includes(String(x.decision))||x.note!==undefined&&(typeof x.note!=='string'||x.note.length>1000))return json({error:'Valid request ID, decision and optional note are required.'},400);
 const {data:current,error:readError}=await auth.supabase.from('ai_approval_requests').select('id,status,action_type,risk_level').eq('id',x.id).maybeSingle();
 if(readError||!current)return json({error:'Approval request not found.'},404);
 if(current.status!=='pending')return json({error:'This request has already been reviewed.'},409);
 const {data,error}=await auth.supabase.from('ai_approval_requests').update({status:x.decision,reviewed_by:auth.user.id,reviewed_at:new Date().toISOString(),review_note:typeof x.note==='string'?x.note.trim():null,updated_at:new Date().toISOString()}).eq('id',x.id).eq('status','pending').select('id,status,action_type').maybeSingle();
 if(error||!data)return json({error:'Approval decision could not be saved; refresh and retry.'},409);
 const audit=await auth.supabase.from('audit_events').insert({actor_id:auth.user.id,action:'ai_approval.'+String(x.decision),resource_type:'ai_approval_request',resource_id:x.id,outcome:'success',details:{action_type:current.action_type,risk_level:current.risk_level,note:typeof x.note==='string'?x.note.trim():null}});
 if(audit.error)console.error('Approval decision audit failed:',audit.error.message);
 return json({request:data,message:'Decision recorded. This does not execute the proposed business action.'});
}
