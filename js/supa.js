/* ============================================================
   Lugha — client Supabase, exposé en LZ.sb
   ============================================================ */
(() => {
  'use strict';
  const SB_URL = 'https://rdbybcorqbbfshimgfnr.supabase.co';
  const SB_KEY = 'sb_publishable_Euo6P0bAB6DClY1obRXNrg_rKJstRHv';
  LZ.sb = window.supabase.createClient(SB_URL, SB_KEY);
})();
