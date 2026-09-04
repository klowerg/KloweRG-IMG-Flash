import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

export const env = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  cavotiKey: process.env.CAVOTI_API_KEY || '',
  cavotiBase: process.env.CAVOTI_BASE_URL || 'https://cavoti.com/v1',
}

let adminClient: SupabaseClient | null = null

export function admin() {
  if (!env.supabaseUrl || !env.serviceKey) throw new Error('Supabase no está configurado en Vercel.')
  if (!adminClient) adminClient = createClient(env.supabaseUrl, env.serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  return adminClient
}

export async function authenticate(request: Request): Promise<User> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) throw new HttpError(401, 'Sesión requerida.')
  if (!env.supabaseUrl || !env.anonKey) throw new HttpError(503, 'Supabase no está configurado en Vercel.')
  const client = createClient(env.supabaseUrl, env.anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const result = await client.auth.getUser(token)
  if (result.error || !result.data.user) throw new HttpError(401, 'Sesión de Supabase inválida.')
  return result.data.user
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

export function response(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function failure(error: unknown) {
  const status = error instanceof HttpError ? error.status : 502
  const message = error instanceof Error ? error.message : 'Error inesperado.'
  console.error('KloweRG API:', message)
  return response({ detail: message }, status)
}

export async function cavoti(path: string, payload: unknown) {
  if (!env.cavotiKey) throw new HttpError(503, 'CAVOTI_API_KEY no está configurada en Vercel.')
  const result = await fetch(`${env.cavotiBase.replace(/\/$/, '')}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.cavotiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await result.json().catch(() => ({})) as Record<string, any>
  if (!result.ok) throw new HttpError(result.status >= 500 ? 502 : result.status, data.error?.message || 'Cavoti rechazó la solicitud.')
  return data
}

export function decodePng(value: string) {
  const bytes = Buffer.from(value, 'base64')
  if (bytes.length < 24 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new HttpError(502, 'Cavoti devolvió una imagen inválida.')
  return { bytes, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

export async function signedUrl(path: string) {
  const result = await admin().storage.from('generation-images').createSignedUrl(path, 3600)
  if (result.error) throw result.error
  return result.data.signedUrl
}

