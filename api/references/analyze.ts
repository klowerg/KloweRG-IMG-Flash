import { authenticate, cavoti, failure, HttpError, response } from '../../server/core.js'

export default async function handler(request: Request) {
  try {
    if (request.method !== 'POST') return response({ detail: 'Método no permitido.' }, 405)
    await authenticate(request)
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) throw new HttpError(400, 'Debes subir una imagen.')
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new HttpError(415, 'Usa una imagen PNG, JPG o WebP.')
    if (file.size > 4 * 1024 * 1024) throw new HttpError(413, 'La referencia no puede superar 4 MB.')
    const encoded = Buffer.from(await file.arrayBuffer()).toString('base64')
    const result = await cavoti('chat/completions', { model: 'deepseek-v4-flash-vision-exp', messages: [{ role: 'user', content: [{ type: 'text', text: 'Describe la imagen con precisión para usarla como referencia de generación. Enfócate en sujeto, composición, iluminación, materiales, colores y estilo. Responde en español, en un solo bloque.' }, { type: 'image_url', image_url: { url: `data:${file.type};base64,${encoded}` } }] }], max_tokens: 500 })
    return response({ analysis: result.choices?.[0]?.message?.content || '', model: 'deepseek-v4-flash-vision-exp' })
  } catch (error) { return failure(error) }
}
