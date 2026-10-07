/* ============================================================
   Lugha — client Supabase, exposé en LZ.sb
   ============================================================ */
(() => {
  'use strict';
  const SB_URL = 'https://rdbybcorqbbfshimgfnr.supabase.co';
  const SB_KEY = 'sb_publishable_Euo6P0bAB6DClY1obRXNrg_rKJstRHv';
  // Clé publique (publishable) : sans danger dans le navigateur, les règles RLS protègent les données.
  // PKCE : le retour de Google arrive en ?code=…, sans entrer en conflit avec le routeur par #.
  LZ.sb = window.supabase.createClient(SB_URL, SB_KEY, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
