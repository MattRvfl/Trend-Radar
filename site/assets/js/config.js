// Configuration publique des comptes. Seules la clé « anon » (publique) et l'URL du projet vont ici :
// jamais la clé service_role. Vides = comptes désactivés, le reste du site fonctionne normalement.
// Si l'URL n'est pas en *.supabase.co, adapter aussi connect-src dans la CSP d'index.html.
export const SUPABASE_URL = "https://vofgtkmzaxiemrxgbwfz.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Jsdyl_iYgRJcQIt6N91JDg_JwEk81Ck";
export const CONTACT_EMAIL = "";
// Clé publique VAPID des notifications push (la clé privée est uniquement dans les secrets GitHub).
export const VAPID_PUBLIC_KEY = "BHuyyTu1ENi9ohLS-zNHnIJ9uWmhjMG-kyX3zHNmjatrM93Hdszv92MStJNywno4nqoHw8WOO32ZloXy6FxiLs0";
