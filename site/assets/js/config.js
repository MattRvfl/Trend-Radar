// Configuration publique des comptes. Seules la clé « anon » (publique) et l'URL du projet vont ici :
// jamais la clé service_role. Vides = comptes désactivés, le reste du site fonctionne normalement.
// Si l'URL n'est pas en *.supabase.co, adapter aussi connect-src dans la CSP d'index.html.
export const SUPABASE_URL = "";
export const SUPABASE_ANON_KEY = "";
export const CONTACT_EMAIL = "";
