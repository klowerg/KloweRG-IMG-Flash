import { admin, authenticate, failure, response } from '../../server/core.js'

export default async function handler(request: Request) {
  try {
    if (request.method !== 'DELETE') return response({ detail: 'Método no permitido.' }, 405)
    const user = await authenticate(request)
    const id = new URL(request.url).pathname.split('/').filter(Boolean).at(-1)
    if (!id) return response({ detail: 'Generación no encontrada.' }, 404)
    const rows = await admin().from('generation_images').select('storage_path').eq('generation_id', id).eq('user_id', user.id)
    if (rows.error) throw rows.error
    const paths = (rows.data || []).map((row: { storage_path: string }) => row.storage_path)
    if (paths.length) {
      const removed = await admin().storage.from('generation-images').remove(paths)
      if (removed.error) throw removed.error
    }
    const deleted = await admin().from('generations').delete().eq('id', id).eq('user_id', user.id)
    if (deleted.error) throw deleted.error
    return new Response(null, { status: 204 })
  } catch (error) { return failure(error) }
}
