// Supabase Edge Function opcional: admin-users
// Use somente quando quiser criar/excluir contas diretamente pelo painel do Estuda+.
// Nunca coloque SUPABASE_SERVICE_ROLE_KEY no navegador.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '*'
  const cors = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const admin = createClient(url, service)
    const { data: profile } = await admin.from('profiles').select('*').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin' || profile.blocked) throw new Error('Apenas administrador')

    const body = await req.json()
    const action = body.action

    if (action === 'create') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!email.includes('@')) throw new Error('E-mail inválido')
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: { name: body.name }
      })
      if (error) throw error
      const id = data.user.id
      const patch = {
        name: body.name,
        username: String(body.username || email.split('@')[0]).toLowerCase(),
        grade: Number(body.grade) || 5,
        unlocked_grades: [Number(body.grade) || 5],
        unlocked_subjects: ['Matemática','Português','Ciências','História','Geografia'],
        exams_unlocked: true
      }
      const { data: row, error: pe } = await admin.from('profiles').update(patch).eq('id', id).select().single()
      if (pe) throw pe
      return new Response(JSON.stringify({ ok: true, profile: row }), { headers: cors })
    }

    if (action === 'update') {
      const { data, error } = await admin.from('profiles').update(body.patch || {}).eq('id', body.profileId).select().single()
      if (error) throw error
      return new Response(JSON.stringify({ ok: true, profile: data }), { headers: cors })
    }

    if (action === 'delete') {
      const { error } = await admin.auth.admin.deleteUser(body.profileId)
      if (error) throw error
      return new Response(JSON.stringify({ ok: true }), { headers: cors })
    }

    throw new Error('Ação inválida')
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 400, headers: cors })
  }
})
