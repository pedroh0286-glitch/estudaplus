// Supabase Edge Function: admin-users
// Deploy with SUPABASE_SERVICE_ROLE_KEY as a secret.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '*'
  const cors = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Content-Type':'application/json'}
  if (req.method === 'OPTIONS') return new Response('ok',{headers:cors})
  try {
    const url=Deno.env.get('SUPABASE_URL')!, anon=Deno.env.get('SUPABASE_ANON_KEY')!, service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader=req.headers.get('Authorization')||''
    const userClient=createClient(url,anon,{global:{headers:{Authorization:authHeader}}})
    const {data:{user}}=await userClient.auth.getUser()
    if(!user) throw new Error('Não autenticado')
    const admin=createClient(url,service)
    const {data:profile}=await admin.from('profiles').select('*').eq('auth_id',user.id).single()
    if(!profile||profile.role!=='admin'||profile.blocked) throw new Error('Apenas administrador')
    const body=await req.json()
    const action=body.action
    if(action==='create'){
      const email=`${String(body.username).toLowerCase()}@estudaplus.local`
      const {data, error}=await admin.auth.admin.createUser({email,password:body.password,email_confirm:true})
      if(error) throw error
      const id=crypto.randomUUID()
      const row={id,auth_id:data.user.id,username:String(body.username).toLowerCase(),name:body.name,role:'student',grade:Number(body.grade)||5,unlocked_grades:[Number(body.grade)||5],unlocked_subjects:['Matemática','Português','Ciências','História','Geografia'],exams_unlocked:true}
      const {error:pe}=await admin.from('profiles').insert(row); if(pe) throw pe
      await admin.from('user_state').insert({profile_id:id,state:{}})
      return new Response(JSON.stringify({ok:true,profile:row}),{headers:cors})
    }
    if(action==='update'){
      const patch=body.patch||{}
      const {data,error}=await admin.from('profiles').update(patch).eq('id',body.profileId).select().single(); if(error) throw error
      return new Response(JSON.stringify({ok:true,profile:data}),{headers:cors})
    }
    if(action==='delete'){
      const {data:p}=await admin.from('profiles').select('auth_id').eq('id',body.profileId).single()
      if(p?.auth_id) await admin.auth.admin.deleteUser(p.auth_id)
      return new Response(JSON.stringify({ok:true}),{headers:cors})
    }
    throw new Error('Ação inválida')
  } catch(e){return new Response(JSON.stringify({ok:false,error:e.message}),{status:400,headers:cors})}
})
