// Gera js/config.js a partir das variáveis do Netlify (Site configuration › Environment variables).
// Roda sozinho a cada publicação, pelo netlify.toml. Sem variáveis, mantém o arquivo como está.
const fs = require('fs');
const path = require('path');

const url = (process.env.SUPABASE_URL || '').trim().replace(/\/(rest|auth)\/v1.*$/, '').replace(/\/+$/, '');
const key = (process.env.SUPABASE_ANON_KEY || '').trim();
const contato = (process.env.CONTATO || '').trim();

if (!url || !key) {
  console.log('[Ca$a] SUPABASE_URL ou SUPABASE_ANON_KEY não definidos: js/config.js mantido como está.');
  process.exit(0);
}
if (/^sb_secret_/.test(key)) {
  console.error('[Ca$a] PARE: SUPABASE_ANON_KEY recebeu a chave SECRETA. Use a Publishable key (sb_publishable_...).');
  process.exit(1);
}

const out = `// Gerado automaticamente por scripts/gerar-config.js — não edite aqui no site publicado.
window.CASA_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(key)},
  CONTATO: ${JSON.stringify(contato)},
  CDI_ANUAL_RESERVA: 13.65
};
`;
fs.writeFileSync(path.join(__dirname, '..', 'js', 'config.js'), out);
console.log('[Ca$a] js/config.js gerado para', url);
