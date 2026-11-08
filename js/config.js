// =============================================================
// Ca$a — configuração
// Opção A (mais simples): cole aqui os valores do seu projeto Supabase.
// Opção B (site ligado ao GitHub): deixe vazio e cadastre as variáveis
//   SUPABASE_URL, SUPABASE_ANON_KEY e CONTATO no Netlify; o arquivo é
//   preenchido sozinho a cada publicação (veja scripts/gerar-config.js).
// Vazio = o app abre em MODO DEMONSTRAÇÃO, com dados de exemplo
// salvos só no navegador.
// =============================================================
window.CASA_CONFIG = {
  SUPABASE_URL: "",       // ex.: "https://abcdefgh.supabase.co" (sem nada depois do .co)
  SUPABASE_ANON_KEY: "",  // a "Publishable key" (sb_publishable_...) — pode ficar no site, é pública
  CONTATO: "",            // e-mail para pedidos sobre dados pessoais (aparece na página de privacidade)

  // Usada só se o site do Banco Central não responder
  CDI_ANUAL_RESERVA: 13.65
};
