export const models = [
  { id: 'gpt-image-2', name: 'GPT Image 2', kind: 'image', available: true, description: 'Equilibrio entre detalle, velocidad y composición.', options: { size: ['1024x1024', '1536x1024', '1024x1536'], quality: ['standard', 'high'] } },
  { id: 'gpt-image-2-4k', name: 'GPT Image 2 · 4K', kind: 'image', available: true, description: 'Máxima resolución para piezas de alto detalle.', options: { size: ['2048x2048', '3840x2160'], quality: ['high'] } },
  { id: 'grok-imagine-image', name: 'Grok Imagine', kind: 'image', available: true, description: 'Dirección visual expresiva con resultados rápidos.', options: { size: ['1024x1024', '1536x1024', '1024x1536'], quality: ['standard'] } },
  { id: 'grok-imagine-image-quality', name: 'Grok Imagine Quality', kind: 'image', available: true, description: 'Mayor acabado para composiciones exigentes.', options: { size: ['1024x1024', '1536x1024', '1024x1536'], quality: ['high'] } },
  { id: 'deepseek-v4-flash-vision-exp', name: 'DeepSeek Vision', kind: 'vision', available: true, description: 'Analiza referencias para enriquecer el prompt.', options: {} },
] as const

