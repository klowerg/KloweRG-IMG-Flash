export default function handler() {
  return Response.json({
    status: 'ok',
    supabase_configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),
    cavoti_configured: Boolean(process.env.CAVOTI_API_KEY),
  })
}
