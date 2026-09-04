import { admin, authenticate, cavoti, decodePng, failure, HttpError, response, signedUrl } from '../server/core.js'
import { models } from '../server/models.js'

async function list(request: Request) {
  const user = await authenticate(request)
  const result = await admin().from('generations').select('*,generation_images(*)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50)
  if (result.error) throw result.error
  return response(await Promise.all((result.data || []).map(async (row: any) => ({
    id: row.id,
    status: row.status,
    model: row.model,
    prompt: row.prompt,
    revised_prompt: row.revised_prompt,
    options: row.options || {},
    created_at: row.created_at,
    images: await Promise.all((row.generation_images || []).map(async (image: any) => ({ id: image.id, url: await signedUrl(image.storage_path), width: image.width, height: image.height }))),
  }))))
}

async function generate(request: Request) {
  const user = await authenticate(request)
  const body = await request.json() as Record<string, any>
  if (typeof body.prompt !== 'string' || body.prompt.trim().length < 3 || body.prompt.length > 4000) throw new HttpError(400, 'Escribe un prompt entre 3 y 4000 caracteres.')
  const model = models.find((item) => item.id === body.model && item.kind === 'image')
  if (!model) throw new HttpError(400, 'Selecciona un modelo de generación válido.')
  const sizes: readonly string[] = 'size' in model.options ? model.options.size : []
  if (!sizes.includes(body.size)) throw new HttpError(400, 'La resolución no es compatible con este modelo.')
  const prompt = body.reference_analysis ? `${body.prompt}\n\nReferencia visual analizada:\n${String(body.reference_analysis).slice(0, 6000)}` : body.prompt
  const cavotiResult = await cavoti('images/generations', { model: body.model, prompt, size: body.size, quality: body.quality, n: Math.min(Math.max(Number(body.count) || 1, 1), 4), response_format: 'b64_json' })
  const generationId = crypto.randomUUID()
  const images: { id: string; path: string; width: number; height: number }[] = []
  for (const item of cavotiResult.data || []) {
    if (!item.b64_json) continue
    const image = decodePng(item.b64_json)
    const id = crypto.randomUUID()
    const path = `${user.id}/${id}.png`
    const upload = await admin().storage.from('generation-images').upload(path, image.bytes, { contentType: 'image/png', upsert: true })
    if (upload.error) throw upload.error
    images.push({ id, path, width: image.width, height: image.height })
  }
  if (!images.length) throw new HttpError(502, 'Cavoti no devolvió imágenes.')
  const options = { size: body.size, quality: body.quality, aspect_ratio: body.aspect_ratio, count: body.count }
  const generation = await admin().from('generations').insert({ id: generationId, user_id: user.id, prompt: body.prompt, model: body.model, options, revised_prompt: cavotiResult.data?.[0]?.revised_prompt || null, status: 'completed' })
  if (generation.error) throw generation.error
  const imageRows = images.map((item: { id: string; path: string; width: number; height: number }) => ({ id: item.id, generation_id: generationId, user_id: user.id, storage_path: item.path, width: item.width, height: item.height }))
  const storedImages = await admin().from('generation_images').insert(imageRows)
  if (storedImages.error) throw storedImages.error
  return response({ id: generationId, status: 'completed', model: body.model, prompt: body.prompt, revised_prompt: cavotiResult.data?.[0]?.revised_prompt || null, options, created_at: new Date().toISOString(), images: await Promise.all(images.map(async (item) => ({ id: item.id, url: await signedUrl(item.path), width: item.width, height: item.height }))) })
}

export default async function handler(request: Request) {
  try {
    if (request.method === 'GET') return await list(request)
    if (request.method === 'POST') return await generate(request)
    return response({ detail: 'Método no permitido.' }, 405)
  } catch (error) { return failure(error) }
}
