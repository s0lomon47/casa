/* Ca$a — app de contas da família
   Um arquivo só, sem build: abra o index.html por um servidor (ou publique no Netlify). */
(() => {
  'use strict';

  const CFG = window.CASA_CONFIG || {};
  const DEMO = !CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || !window.supabase;
  const TABLES = ['contas', 'pagamentos', 'mercado_itens', 'aplicacoes', 'aportes', 'desejos'];

  // ---------------------------------------------------------------- utilidades
  const $ = (s, r = document) => r.querySelector(s);
  const h = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtNum = (v) => (Number(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parseMoney = (s) => {
    s = String(s ?? '').trim().replace(/[R$\s]/g, '');
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.round(n * 100) / 100;
  };
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0; return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));
  const sum = (arr, f) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);
  const ym = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const addMonths = (m, n) => {
    let [y, mo] = m.split('-').map(Number);
    const t = y * 12 + (mo - 1) + n;
    return `${Math.floor(t / 12)}-${pad((t % 12) + 1)}`;
  };
  const diffMonths = (a, b) => {
    const [ya, ma] = a.split('-').map(Number); const [yb, mb] = b.split('-').map(Number);
    return (yb - ya) * 12 + (mb - ma);
  };
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const monthLabel = (m) => { const [y, mo] = m.split('-').map(Number); const n = MESES[mo - 1]; return n[0].toUpperCase() + n.slice(1) + ' ' + y; };
  const monthShort = (m) => MESES[Number(m.split('-')[1]) - 1].slice(0, 3);
  const daysInMonth = (m) => { const [y, mo] = m.split('-').map(Number); return new Date(y, mo, 0).getDate(); };
  const dateBR = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };
  const lsDel = (k) => { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } };

  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="17" cy="20" r="1"/></svg>',
    trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8M15 7h6v6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>'
  };
  const brandName = (sobrenome, tag = 'span') => `<${tag} class="brand-name">Ca<span class="cif">$</span>a${sobrenome ? ` <small>${h(sobrenome)}</small>` : ''}</${tag}>`;

  // ---------------------------------------------------------------- backend: Supabase
  function supaBackend() {
    const url = String(CFG.SUPABASE_URL).trim().replace(/\/(rest|auth)\/v1.*$/, '').replace(/\/+$/, '');
    const sb = window.supabase.createClient(url, String(CFG.SUPABASE_ANON_KEY).trim(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const ok = ({ data, error }) => { if (error) throw error; return data; };
    const back = location.origin + location.pathname;
    return {
      async session() { return ok(await sb.auth.getSession()).session; },
      onAuth(cb) { sb.auth.onAuthStateChange((ev, s) => cb(ev, s)); },
      async signIn(email, password) { ok(await sb.auth.signInWithPassword({ email, password })); },
      async signUp(email, password, nome) {
        const d = ok(await sb.auth.signUp({ email, password, options: { data: { nome }, emailRedirectTo: back } }));
        return !!d.session;
      },
      async signOut() { await sb.auth.signOut(); },
      async resetPassword(email) { ok(await sb.auth.resetPasswordForEmail(email, { redirectTo: back })); },
      async updatePassword(password) { ok(await sb.auth.updateUser({ password })); },
      async membership() {
        const user = ok(await sb.auth.getUser()).user;
        const m = ok(await sb.from('membros').select('*').eq('user_id', user.id).maybeSingle());
        if (!m) return { user, membro: null };
        const familia = ok(await sb.from('familias').select('*').eq('id', m.familia_id).single());
        const membros = ok(await sb.from('membros').select('*').order('criado_em'));
        return { user, membro: m, familia, membros };
      },
      async criarFamilia(sobrenome, nome) { ok(await sb.rpc('criar_familia', { p_sobrenome: sobrenome, p_nome: nome })); },
      async excluirConta() { ok(await sb.rpc('excluir_minha_conta', { p_confirmacao: 'EXCLUIR' })); await sb.auth.signOut(); },
      async entrarFamilia(codigo, nome) { ok(await sb.rpc('entrar_familia', { p_codigo: codigo, p_nome: nome })); },
      async select(t) { return ok(await sb.from(t).select('*').order('criado_em')); },
      async temColunas(t, cols) { const { error } = await sb.from(t).select(cols).limit(1); return !error; },
      async insert(t, row) { ok(await sb.from(t).insert(row)); },
      async update(t, id, patch) { ok(await sb.from(t).update(patch).eq('id', id)); },
      async remove(t, id) { ok(await sb.from(t).delete().eq('id', id)); },
      async updateFamilia(id, patch) { ok(await sb.from('familias').update(patch).eq('id', id)); },
      async updateMembro(userId, patch) { ok(await sb.from('membros').update(patch).eq('user_id', userId)); },
      subscribe(cb) { sb.channel('casa').on('postgres_changes', { event: '*', schema: 'public' }, cb).subscribe(); }
    };
  }

  // ---------------------------------------------------------------- backend: demonstração (só neste navegador)
  function demoBackend() {
    const KEY = 'casa-demo-v3';
    const now = () => new Date().toISOString();
    // Família fictícia, com valores inventados, só para demonstração
    const seed = () => {
      const f = { id: uuid(), sobrenome: 'Silva', codigo_convite: 'DEMO42', limite_mercado: 900, aporte_mensal: 1000, meta_reserva: 15000 };
      const me = { user_id: 'demo-user', familia_id: f.id, nome: 'Ana', criado_em: now() };
      const c = (nome, valor, natureza, tipo, quem, recorrencia = 'mensal', parcelas = null) =>
        ({ id: uuid(), familia_id: f.id, nome, valor, natureza, tipo, quem, dia: 10, recorrencia, inicio: ym(), parcelas, fim: null, criado_em: now() });
      const apl = { id: uuid(), familia_id: f.id, nome: 'Reserva de emergência', instituicao: 'CDB liquidez diária', pct_cdi: 100, saldo_base: 6500, data_base: todayISO(), base_atualizada_em: now(), criado_em: now() };
      const it = (nome, valor, ativo = true, quantidade = 1) => ({ id: uuid(), familia_id: f.id, nome, valor, ativo, categoria: '', quantidade, volta_em: null, criado_em: now() });
      return {
        session: { user: { id: 'demo-user', email: 'demo@exemplo.com', user_metadata: { nome: 'Ana' } } },
        familia: f, membros: [me, { user_id: 'demo-2', familia_id: f.id, nome: 'João', criado_em: now() }],
        tables: {
          contas: [
            c('Salário Ana', 4200, 'receita', 'Salário', 'Ana'), c('Salário João', 3500, 'receita', 'Salário', 'João'),
            c('Aluguel', 1500, 'despesa', 'Fixa', 'Casa'), c('Condomínio', 380, 'despesa', 'Fixa', 'Casa'),
            c('Energia', 210, 'despesa', 'Fixa', 'Casa'), c('Internet', 110, 'despesa', 'Fixa', 'Casa'),
            c('Plano de saúde', 420, 'despesa', 'Fixa', 'Casa'), c('Escola', 600, 'despesa', 'Fixa', 'Casa'),
            c('Financiamento do carro', 890, 'despesa', 'Parcela', 'Casa', 'parcelado', 10),
            c('Cartão', 650, 'despesa', 'Cartão', 'Ana'), c('Streaming', 55, 'despesa', 'Cartão', 'João')
          ],
          pagamentos: [],
          mercado_itens: [it('Arroz 5 kg', 28.90), it('Feijão 1 kg', 8.50), it('Café 500 g', 18.90), it('Leite', 59.88, true, 12),
            it('Carne', 120), it('Frango', 45), it('Frutas e verduras', 60), it('Produtos de limpeza', 55, false), it('Higiene', 48), it('Azeite', 32, false)],
          aplicacoes: [apl],
          aportes: [],
          desejos: [
            { id: uuid(), familia_id: f.id, nome: 'Ar-condicionado do quarto', valor: 2200, prioridade: 'alta', ordem: 1, link: '', quem: 'Casa', comprado: false, comprado_em: null, criado_em: now() },
            { id: uuid(), familia_id: f.id, nome: 'Sofá novo', valor: 3500, prioridade: 'media', ordem: 2, link: '', quem: 'Casa', comprado: false, comprado_em: null, criado_em: now() },
            { id: uuid(), familia_id: f.id, nome: 'Air fryer', valor: 450, prioridade: 'baixa', ordem: 3, link: '', quem: 'Casa', comprado: false, comprado_em: null, criado_em: now() }
          ]
        }
      };
    };
    let db;
    try { db = JSON.parse(lsGet(KEY) || 'null'); } catch { db = null; }
    if (!db) db = seed();
    const save = () => lsSet(KEY, JSON.stringify(db));
    save();
    const tick = () => Promise.resolve();
    return {
      async session() { return db.session; },
      onAuth() { /* nada na demonstração */ },
      async signIn() { if (!db.session) { db = seed(); save(); } },
      async signUp() { db = seed(); save(); return true; },
      async signOut() { db = { session: null }; save(); },
      async resetPassword() { await tick(); },
      async updatePassword() { await tick(); },
      async membership() {
        const me = db.membros?.find((m) => m.user_id === 'demo-user');
        return { user: db.session?.user, membro: me || null, familia: db.familia, membros: db.membros || [] };
      },
      async criarFamilia() { db = seed(); save(); },
      async excluirConta() { db = { session: null }; save(); },
      async entrarFamilia() { db = seed(); save(); },
      async select(t) { return JSON.parse(JSON.stringify(db.tables?.[t] || [])); },
      async temColunas() { return true; },
      async insert(t, row) { (db.tables[t] = db.tables[t] || []).push({ criado_em: now(), ...row }); save(); },
      async update(t, id, patch) { const r = db.tables[t].find((x) => x.id === id); if (r) Object.assign(r, patch); save(); },
      async remove(t, id) {
        db.tables[t] = db.tables[t].filter((x) => x.id !== id);
        if (t === 'contas') db.tables.pagamentos = db.tables.pagamentos.filter((p) => p.conta_id !== id);
        if (t === 'aplicacoes') db.tables.aportes = db.tables.aportes.filter((p) => p.aplicacao_id !== id);
        save();
      },
      async updateFamilia(id, patch) { Object.assign(db.familia, patch); save(); },
      async updateMembro(userId, patch) { const m = db.membros.find((x) => x.user_id === userId); if (m) Object.assign(m, patch); save(); },
      subscribe() { /* nada na demonstração */ }
    };
  }

  const API = DEMO ? demoBackend() : supaBackend();

  // ---------------------------------------------------------------- estado
  const S = {
    phase: 'loading',          // loading | auth | onboarding | app | recovery
    authView: 'login',         // login | signup | forgot
    onboardTab: 'criar',
    view: 'painel',
    mes: ym(),
    filtroContas: 'despesa',
    user: null, membro: null, familia: null, membros: [],
    data: { contas: [], pagamentos: [], mercado_itens: [], aplicacoes: [], aportes: [], desejos: [] },
    semDesejos: false,
    v4: false,            // banco já tem as colunas da atualização 4?
    abaMercado: 'lista',  // lista | casa
    cdi: null,
    sheet: null,
    installEvt: null,
    pendingRender: false,
    msg: ''
  };
  const VIEWS = ['painel', 'contas', 'mercado', 'desejos', 'reserva', 'ajustes'];

  // ---------------------------------------------------------------- cálculos
  function ativaNoMes(c, m) {
    if (m < c.inicio) return false;
    if (c.fim && m > c.fim) return false;
    if (c.recorrencia === 'unica') return m === c.inicio;
    if (c.recorrencia === 'parcelado') return diffMonths(c.inicio, m) < (Number(c.parcelas) || 1);
    return true;
  }
  function contasDoMes(m) {
    return S.data.contas.filter((c) => ativaNoMes(c, m)).map((c) => {
      const p = S.data.pagamentos.find((x) => x.conta_id === c.id && x.mes === m);
      const dia = Math.min(Number(c.dia) || 1, daysInMonth(m));
      return {
        ...c, dia, mes: m, pago: !!p && p.pago !== false, pagId: p ? p.id : null, ajustado: !!(p && p.ajustado),
        valorMes: p && p.valor != null ? Number(p.valor) : Number(c.valor),
        parcelaTxt: c.recorrencia === 'parcelado' ? `${diffMonths(c.inicio, m) + 1}/${c.parcelas}` : ''
      };
    });
  }
  function resumo(m) {
    const l = contasDoMes(m);
    const rec = l.filter((c) => c.natureza === 'receita');
    const des = l.filter((c) => c.natureza === 'despesa');
    const R = sum(rec, (c) => c.valorMes); const D = sum(des, (c) => c.valorMes);
    const aPagar = sum(des.filter((c) => !c.pago), (c) => c.valorMes);
    return { l, rec, des, R, D, sobra: R - D, aPagar, pago: D - aPagar };
  }
  function prazo(c, m) {
    // dias até vencer: negativo = atrasada; null = mês futuro
    const hoje = ym();
    if (m > hoje) return null;
    if (m < hoje) return -999;
    return c.dia - new Date().getDate();
  }
  // Despesas em aberto que pedem atenção: atrasadas (de qualquer mês até 1 ano atrás) e as que vencem em até 3 dias
  function vencendo() {
    const hoje = ym(); const out = [];
    const inicios = S.data.contas.map((c) => c.inicio).sort();
    let m = inicios[0] && inicios[0] < hoje ? inicios[0] : hoje;
    if (diffMonths(m, hoje) > 12) m = addMonths(hoje, -12);
    for (; m <= hoje; m = addMonths(m, 1)) {
      for (const c of contasDoMes(m)) {
        if (c.natureza !== 'despesa' || c.pago) continue;
        const dias = prazo(c, m);
        if (dias !== null && dias <= 3) out.push({ ...c, dias });
      }
    }
    return out.sort((a, b) => a.mes.localeCompare(b.mes) || a.dias - b.dias);
  }
  // Mês mais antigo (antes do atual) que ainda tem conta sem pagar
  function mesComPendencia() { const v = vencendo().find((c) => c.mes < ym()); return v ? v.mes : null; }
  const CATS = ['Alimentos', 'Carnes e frios', 'Hortifrúti', 'Padaria e laticínios', 'Bebidas', 'Higiene', 'Limpeza', 'Casa', 'Pet', 'Outros'];
  const norm = (t) => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  // Palavras que indicam a categoria ("=" na frente = palavra inteira)
  const CAT_KW = [
    ['Limpeza', ['agua sanitaria', 'detergente', 'sabao', 'amaciante', 'desinfetante', 'esponja', 'limpeza', 'alvejante', 'multiuso', 'saco de lixo', 'lustra', 'limpa', 'candida', 'bombril', '=pano']],
    ['Alimentos', ['leite condensado', 'creme de leite', 'leite em po', 'arroz', 'feijao', 'macarrao', 'massa', 'farinha', 'acucar', '=sal', 'oleo', 'azeite', 'cafe', 'molho', 'tempero', 'biscoito', 'bolacha', 'cereal', 'aveia', 'milho', 'ervilha', 'extrato', 'achocolatado', 'miojo', 'granola', '=mel', 'vinagre', 'maionese', 'ketchup', 'mostarda', 'atum', 'sardinha', '=ovo', '=ovos', 'chocolate', 'pipoca', 'lentilha', 'fuba', 'polvilho', 'gelatina', '=doce', 'salgadinho']],
    ['Carnes e frios', ['carne', 'frango', 'peixe', 'linguica', 'bacon', 'presunto', 'queijo', 'mortadela', 'salsicha', 'hamburguer', '=gado', 'costela', 'picanha', '=file', 'coxa', '=peito', 'patinho', 'alcatra', 'salame', 'calabresa']],
    ['Hortifrúti', ['fruta', 'verdura', 'legume', 'banana', '=maca', 'tomate', 'cebola', '=alho', 'batata', 'alface', 'cenoura', 'laranja', 'limao', 'mamao', '=uva', 'abacaxi', 'melancia', 'morango', 'couve', 'brocolis', 'pepino', 'abobrinha', 'hortifruti']],
    ['Padaria e laticínios', ['=pao', '=paes', 'leite', 'iogurte', 'manteiga', 'margarina', 'requeijao', '=bolo', '=nata', 'torrada']],
    ['Bebidas', ['=agua', 'suco', 'refrigerante', '=refri', 'cerveja', 'vinho', '=cha', 'energetico']],
    ['Higiene', ['sabonete', 'shampoo', 'xampu', 'condicionador', 'pasta de dente', 'creme dental', 'escova', 'papel higienico', 'desodorante', 'absorvente', 'fralda', 'barbeador', 'higiene', 'fio dental', 'algodao', 'cotonete']],
    ['Casa', ['lampada', 'pilha', '=vela', 'fosforo', 'papel toalha', 'guardanapo', 'papel aluminio']],
    ['Pet', ['racao', '=areia', '=pet', '=gato', 'cachorro']]
  ];
  function categoriaSugerida(nome) {
    const n = norm(nome);
    for (const [cat, kws] of CAT_KW) for (const k of kws) {
      const exato = k[0] === '='; const kw = exato ? k.slice(1) : k;
      if (new RegExp('(^|[^a-z])' + kw + (exato ? '($|[^a-z])' : '')).test(n)) return cat;
    }
    return 'Outros';
  }
  const catDe = (i) => (i.categoria && CATS.includes(i.categoria) ? i.categoria : categoriaSugerida(i.nome));
  const qtdDe = (i) => Math.max(1, parseInt(i.quantidade, 10) || 1);
  function mercadoTotais() {
    const itens = S.data.mercado_itens;
    const ativos = itens.filter((i) => i.ativo);
    const total = sum(ativos, (i) => i.valor);
    const limite = Number(S.familia?.limite_mercado) || 0;
    return { itens, ativos: ativos.length, total, limite, sobra: limite - total };
  }

  // CDI do Banco Central (série 12 = taxa diária; 4389 = taxa anual)
  const bcbDate = (iso) => dateBR(iso);
  async function fetchJSON(url, ms = 8000) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); }
    finally { clearTimeout(t); }
  }
  async function loadCDI() {
    const fallback = Number(CFG.CDI_ANUAL_RESERVA) || 13.65;
    const cdi = { fonte: 'estimado', anual: fallback, daily: null };
    try {
      const a = await fetchJSON('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json');
      const v = parseFloat(String(a?.[0]?.valor).replace(',', '.'));
      if (v > 0) { cdi.anual = v; cdi.fonte = 'bcb'; }
    } catch { /* usa a reserva */ }
    const datas = [...S.data.aplicacoes.map((a) => a.data_base), ...S.data.aportes.map((a) => a.data)].filter(Boolean).sort();
    const ini = datas[0];
    if (ini && ini < todayISO()) {
      try {
        const rows = await fetchJSON(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json&dataInicial=${bcbDate(ini)}&dataFinal=${bcbDate(todayISO())}`);
        cdi.daily = rows.map((r) => { const [d, mo, y] = r.data.split('/'); return [`${y}-${mo}-${d}`, parseFloat(String(r.valor).replace(',', '.'))]; });
      } catch { /* sem série diária: usa a taxa anual */ }
    }
    S.cdi = cdi;
  }
  function fator(fromISO, pct) {
    const p = (Number(pct) || 100) / 100;
    const hoje = todayISO();
    if (!fromISO || fromISO >= hoje) return 1;
    const cdi = S.cdi || { anual: Number(CFG.CDI_ANUAL_RESERVA) || 13.65 };
    if (cdi.daily && cdi.daily.length) {
      let f = 1;
      for (const [d, r] of cdi.daily) if (d > fromISO && d <= hoje) f *= 1 + (r / 100) * p;
      return f;
    }
    const dias = (new Date(hoje) - new Date(String(fromISO).slice(0, 10))) / 86400000;
    return Math.pow(1 + cdi.anual / 100, (dias / 365) * p);
  }
  function aplicacaoInfo(a) {
    const ap = S.data.aportes.filter((x) => x.aplicacao_id === a.id && String(x.criado_em || '') > String(a.base_atualizada_em || ''));
    const aportado = Number(a.saldo_base) + sum(ap, (x) => x.valor);
    const estimado = Number(a.saldo_base) * fator(a.data_base, a.pct_cdi) + sum(ap, (x) => Number(x.valor) * fator(x.data, a.pct_cdi));
    return { aportado, estimado, rendeu: estimado - aportado };
  }
  function reservaTotais() {
    const infos = S.data.aplicacoes.map((a) => ({ a, ...aplicacaoInfo(a) }));
    const estimado = sum(infos, (i) => i.estimado); const aportado = sum(infos, (i) => i.aportado);
    const mesAtual = ym();
    const aporteMes = sum(S.data.aportes.filter((x) => String(x.data).slice(0, 7) === mesAtual), (x) => x.valor);
    const meta = Number(S.familia?.meta_reserva) || 0; const plano = Number(S.familia?.aporte_mensal) || 0;
    return { infos, estimado, aportado, rendeu: estimado - aportado, aporteMes, meta, plano, falta: Math.max(0, plano - aporteMes) };
  }
  function projecao(saldo, plano, meses = 12) {
    const anual = S.cdi?.anual || Number(CFG.CDI_ANUAL_RESERVA) || 13.65;
    const r = Math.pow(1 + anual / 100, 1 / 12) - 1;
    const out = []; let s = saldo; let m = ym();
    for (let i = 0; i < meses; i++) { m = addMonths(m, 1); s = s * (1 + r) + plano; out.push({ m, v: s }); }
    return out;
  }

  // ---------------------------------------------------------------- dados
  async function loadAll() {
    const mb = await API.membership();
    S.user = mb.user; S.membro = mb.membro;
    if (!mb.membro) { S.phase = 'onboarding'; return; }
    S.familia = mb.familia; S.membros = mb.membros || [];
    const res = await Promise.all(TABLES.map((t) => t === 'desejos'
      ? API.select(t).then((r) => { S.semDesejos = false; return r; }).catch(() => { S.semDesejos = true; return []; })
      : API.select(t)));
    TABLES.forEach((t, i) => { S.data[t] = res[i] || []; });
    if (!S.v4) {
      S.v4 = (await API.temColunas('mercado_itens', 'categoria,quantidade,volta_em').catch(() => false))
        && (await API.temColunas('pagamentos', 'pago,ajustado').catch(() => false));
    }
    S.phase = 'app';
    // Itens "em casa" com data para voltar: quando o mês chega, voltam sozinhos para a lista
    if (S.v4) S.data.mercado_itens.filter((i) => !i.ativo && i.volta_em && i.volta_em <= ym())
      .forEach((i) => upd('mercado_itens', i.id, { ativo: true, volta_em: null }));
  }
  let reloadTimer = null;
  function scheduleReload() {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(async () => {
      try { await loadAll(); safeRender(); } catch (e) { console.warn(e); }
    }, 400);
  }
  // Alteração otimista: muda na tela já, grava em seguida
  async function mut(fn, rollbackMsg = 'Não consegui salvar. Confira a internet e tente de novo.') {
    try { await fn(); } catch (e) { console.error(e); toast(rollbackMsg); await loadAll().catch(() => {}); render(); }
  }
  // Colunas da atualização 4: enquanto o banco não tiver, o app não envia esses campos
  const V4_COLS = { mercado_itens: ['categoria', 'quantidade', 'volta_em'], pagamentos: ['pago', 'ajustado'] };
  const limpa = (t, row) => { if (S.v4 || !V4_COLS[t]) return row; const r = { ...row }; V4_COLS[t].forEach((k) => delete r[k]); return r; };
  const ins = (t, row) => { row.id = row.id || uuid(); row.familia_id = S.familia.id; row.criado_em = row.criado_em || new Date().toISOString(); S.data[t].push(row); return mut(() => API.insert(t, limpa(t, row))); };
  const upd = (t, id, patch) => {
    const r = S.data[t].find((x) => x.id === id); if (r) Object.assign(r, patch);
    const envio = limpa(t, patch); if (!Object.keys(envio).length) return Promise.resolve();
    return mut(() => API.update(t, id, envio));
  };
  const del = (t, id) => {
    S.data[t] = S.data[t].filter((x) => x.id !== id);
    if (t === 'contas') S.data.pagamentos = S.data.pagamentos.filter((p) => p.conta_id !== id);
    if (t === 'aplicacoes') S.data.aportes = S.data.aportes.filter((p) => p.aplicacao_id !== id);
    return mut(() => API.remove(t, id));
  };

  // ---------------------------------------------------------------- avisos
  let toastTimer;
  function toast(msg) {
    const el = $('#toast'); el.textContent = msg; el.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
  }
  async function avisarVencimentos() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const v = vencendo(); if (!v.length) return;
    const key = 'casa-aviso-' + todayISO(); if (lsGet(key)) return; lsSet(key, '1');
    const atras = v.filter((c) => c.dias < 0).length;
    const title = atras ? `${atras} conta${atras > 1 ? 's' : ''} atrasada${atras > 1 ? 's' : ''}` : `${v.length} conta${v.length > 1 ? 's vencem' : ' vence'} em breve`;
    const body = v.slice(0, 4).map((c) => `${c.nome} · ${brl(c.valorMes)} · dia ${pad(c.dia)}/${c.mes.slice(5)}`).join('\n');
    try {
      const reg = navigator.serviceWorker ? await navigator.serviceWorker.getRegistration() : null;
      if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', tag: 'casa-vencimentos' });
      else new Notification(title, { body, icon: 'icons/icon-192.png' });
    } catch { /* sem aviso */ }
  }

  // ---------------------------------------------------------------- telas de entrada
  function authScreen() {
    const v = S.authView;
    const logo = `<div class="auth-logo"><img src="icons/icon.svg" alt=""><h1>Ca<span class="cif">$</span>a</h1><p>As contas da família num lugar só. O que um lança, o outro vê na hora.</p></div>`;
    const err = S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : '';
    if (v === 'signup') return `<div class="auth"><div class="auth-box">${logo}
      <form class="form" data-form="signup">
        <div class="field"><label for="su-nome">Seu nome</label><input class="input" id="su-nome" name="nome" autocomplete="given-name" required></div>
        <div class="field"><label for="su-email">E-mail</label><input class="input" id="su-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="su-senha">Senha (mínimo 6 caracteres)</label><input class="input" id="su-senha" name="senha" type="password" minlength="6" autocomplete="new-password" required></div>
        ${err}<button class="btn primary block" type="submit">Criar conta</button>
        <p class="hint">Ao criar a conta você concorda com a <a href="privacidade.html">política de privacidade e os termos de uso</a>.</p>
      </form>
      <button class="linkbtn" data-act="auth-view" data-v="login">Já tenho conta · Entrar</button></div></div>`;
    if (v === 'forgot') return `<div class="auth"><div class="auth-box">${logo}
      <form class="form" data-form="forgot">
        <div class="field"><label for="fg-email">E-mail da sua conta</label><input class="input" id="fg-email" name="email" type="email" autocomplete="email" required></div>
        ${err}<button class="btn primary block" type="submit">Enviar link para nova senha</button>
      </form>
      <button class="linkbtn" data-act="auth-view" data-v="login">Voltar para entrar</button></div></div>`;
    if (v === 'sent') return `<div class="auth"><div class="auth-box">${logo}
      <div class="card"><h2>Confira seu e-mail</h2><p class="muted" style="margin:0">${h(S.msg)}</p></div>
      <button class="btn primary block" data-act="auth-view" data-v="login">Ir para entrar</button></div></div>`;
    return `<div class="auth"><div class="auth-box">${logo}
      <form class="form" data-form="login">
        <div class="field"><label for="li-email">E-mail</label><input class="input" id="li-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field"><label for="li-senha">Senha</label><input class="input" id="li-senha" name="senha" type="password" autocomplete="current-password" required></div>
        ${err}<button class="btn primary block" type="submit">Entrar</button>
      </form>
      <div class="row"><button class="linkbtn" data-act="auth-view" data-v="signup">Criar conta</button><button class="linkbtn" data-act="auth-view" data-v="forgot">Esqueci a senha</button></div>
      <div class="row small"><a href="privacidade.html">Privacidade e termos de uso</a>${temaBtn()}</div>
    </div></div>`;
  }
  function recoveryScreen() {
    return `<div class="auth"><div class="auth-box"><div class="auth-logo"><img src="icons/icon.svg" alt=""><h1>Nova senha</h1></div>
      <form class="form" data-form="newpass">
        <div class="field"><label for="np">Nova senha (mínimo 6 caracteres)</label><input class="input" id="np" name="senha" type="password" minlength="6" autocomplete="new-password" required></div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <button class="btn primary block" type="submit">Salvar nova senha</button>
      </form></div></div>`;
  }
  function onboardingScreen() {
    const nome = S.user?.user_metadata?.nome || '';
    const criar = S.onboardTab === 'criar';
    return `<div class="auth"><div class="auth-box">
      <div class="auth-logo"><span class="label orange">Bem-vindo</span><h1 style="font-size:30px;line-height:1.15">Vamos criar a Ca$a da sua família</h1></div>
      <div class="seg" role="group" aria-label="Como começar">
        <button data-act="onb-tab" data-v="criar" aria-pressed="${criar}">Criar família</button>
        <button data-act="onb-tab" data-v="codigo" aria-pressed="${!criar}">Tenho um código</button>
      </div>
      ${criar ? `
      <div class="preview-name"><img src="icons/icon.svg" alt=""><span class="brand-name">Ca<span class="cif">$</span>a <small id="pv-sobrenome">Sua família</small></span></div>
      <form class="form" data-form="criar-familia">
        <div class="field"><label for="ob-sobrenome">Sobrenome da família</label><input class="input" id="ob-sobrenome" name="sobrenome" placeholder="Ex.: Silva" required data-live="sobrenome"></div>
        <div class="field"><label for="ob-nome">Seu nome</label><input class="input" id="ob-nome" name="nome" value="${h(nome)}" required></div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <button class="btn primary block" type="submit">Criar minha Ca$a</button>
        <p class="hint">Depois você pega o código de convite em Ajustes e manda para quem mora com você.</p>
      </form>` : `
      <form class="form" data-form="entrar-familia">
        <div class="field"><label for="ob-codigo">Código de convite</label><input class="input" id="ob-codigo" name="codigo" placeholder="Ex.: 7F3A2C" autocapitalize="characters" required style="text-transform:uppercase;letter-spacing:.15em;font-weight:700"></div>
        <div class="field"><label for="ob-nome2">Seu nome</label><input class="input" id="ob-nome2" name="nome" value="${h(nome)}" required></div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <button class="btn primary block" type="submit">Entrar na família</button>
        <p class="hint">Quem criou a família encontra o código em Ajustes.</p>
      </form>`}
      <button class="linkbtn" data-act="logout">Sair</button>
    </div></div>`;
  }

  // ---------------------------------------------------------------- app: estrutura
  function navLinks() {
    const items = [['painel', 'Painel', I.home], ['contas', 'Contas', I.list], ['mercado', 'Mercado', I.cart], ['desejos', 'Desejos', I.gift], ['reserva', 'Reserva', I.trend]];
    return items.map(([v, l, ic]) => `<a class="navlink" href="#${v}" ${S.view === v ? 'aria-current="page"' : ''}>${ic}<span>${l}</span></a>`).join('');
  }
  function monthSwitch() {
    return `<div class="month"><button class="iconbtn" data-act="mes" data-v="-1" aria-label="Mês anterior">${I.left}</button><span>${monthLabel(S.mes)}</span><button class="iconbtn" data-act="mes" data-v="1" aria-label="Próximo mês">${I.right}</button></div>`;
  }
  const temaEscuro = () => { const t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches; };
  const temaBtn = () => temaEscuro()
    ? `<button class="iconbtn" data-act="tema-toggle" aria-label="Usar tema claro" title="Tema claro">${I.sun}</button>`
    : `<button class="iconbtn" data-act="tema-toggle" aria-label="Usar tema escuro" title="Tema escuro">${I.moon}</button>`;
  function shell(inner) {
    const titulos = { painel: 'Painel', contas: 'Contas', mercado: 'Mercado', desejos: 'Desejos', reserva: 'Reserva', ajustes: 'Ajustes' };
    const showMonth = S.view === 'painel' || S.view === 'contas';
    return `${DEMO ? '<div class="demo-banner">Modo demonstração · dados de exemplo salvos só neste navegador</div>' : ''}
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><img src="icons/icon.svg" alt="">${brandName(S.familia?.sobrenome)}</div>
        <nav aria-label="Menu">${navLinks()}<a class="navlink" href="#ajustes" ${S.view === 'ajustes' ? 'aria-current="page"' : ''}>${I.gear}<span>Ajustes</span></a></nav>
        <div class="side-foot">${S.view === 'desejos' && !S.semDesejos ? `<button class="btn primary" data-act="novo-desejo">${I.plus} Novo desejo</button>` : `<button class="btn primary" data-act="nova-conta">${I.plus} Nova conta</button>`}<span>Olá, ${h(S.membro?.nome || '')}</span></div>
      </aside>
      <div class="content">
        <header class="topbar">
          <div class="brand"><img src="icons/icon.svg" alt="">${brandName(S.familia?.sobrenome)}</div>
          ${titulos[S.view] ? `<h1 class="mid" style="font-size:22px">${titulos[S.view]}</h1>` : '<span></span>'}
          <div class="actions">${temaBtn()}<a class="iconbtn" href="#ajustes" aria-label="Ajustes">${I.gear}</a></div>
          ${S.view === 'mercado' ? resumoMercadoFixo() : ''}
        </header>
        <main id="main">${showMonth ? `<div class="month-row">${monthSwitch()}</div>` : ''}${inner}</main>
      </div>
    </div>
    <nav class="bottomnav" aria-label="Menu">${navLinks()}</nav>
    ${S.view === 'painel' || S.view === 'contas' ? `<button class="fab" data-act="nova-conta" aria-label="Nova conta">${I.plus}</button>` : ''}
    ${S.view === 'desejos' && !S.semDesejos ? `<button class="fab" data-act="novo-desejo" aria-label="Novo desejo">${I.plus}</button>` : ''}`;
  }

  // ---------------------------------------------------------------- Painel
  function viewPainel() {
    const r = resumo(S.mes);
    const mt = mercadoTotais(); const rv = reservaTotais();
    const livre = r.sobra - mt.limite - rv.plano;
    const atual = S.mes === ym();
    let alerta = '';
    const naoPagas = r.des.filter((c) => !c.pago);
    {
      const v = vencendo();
      const antigas = v.filter((c) => c.mes < ym());
      const seta = I.right.replace('<svg', '<svg width="18" height="18"');
      if (antigas.length && S.mes >= antigas[0].mes) {
        const mesAnt = antigas[0].mes; const doMes = antigas.filter((c) => c.mes === mesAnt);
        const outros = antigas.length - doMes.length;
        alerta = `<button class="alert" data-act="ir-mes" data-mes="${mesAnt}" style="width:100%;text-align:left;cursor:pointer;font:inherit"><span class="ic">${I.bell}</span><span style="flex:1;min-width:0"><b>${doMes.length} conta${doMes.length > 1 ? 's' : ''} de ${MESES[Number(mesAnt.slice(5)) - 1]} sem pagar</b><br><span class="small muted">${brl(sum(doMes, (c) => c.valorMes))}${outros ? ` · e mais ${outros} em outros meses` : ''} · toque para ver</span></span>${seta}</button>`;
      } else if (atual) {
        const doMes = v.filter((c) => c.mes === ym());
        if (doMes.length) {
          const atras = doMes.filter((c) => c.dias < 0);
          const t = atras.length ? `${atras.length} conta${atras.length > 1 ? 's' : ''} atrasada${atras.length > 1 ? 's' : ''}` : `${doMes.length} conta${doMes.length > 1 ? 's vencem' : ' vence'} até dia ${Math.max(...doMes.map((c) => c.dia))}`;
          alerta = `<a class="alert" href="#contas"><span class="ic">${I.bell}</span><span style="flex:1;min-width:0"><b>${t}</b><br><span class="small muted">${brl(sum(doMes, (c) => c.valorMes))} a pagar · toque para ver</span></span>${seta}</a>`;
        }
      }
    }
    if (!alerta && naoPagas.length) {
      const prox = Math.min(...naoPagas.map((c) => c.dia));
      alerta = `<a class="alert ok" href="#contas"><span class="ic">${I.bell}</span><span style="flex:1;min-width:0"><b>${naoPagas.length} conta${naoPagas.length > 1 ? 's' : ''} a pagar</b><br><span class="small muted">${brl(r.aPagar)} · próxima vence dia ${prox}</span></span></a>`;
    } else if (!alerta && r.des.length) {
      alerta = `<div class="alert ok"><span class="ic">${I.ok}</span><span><b>Tudo pago em ${monthLabel(S.mes).toLowerCase()}</b></span></div>`;
    }
    if (!r.l.length) {
      return `<div class="card empty"><h2>Nenhuma conta em ${monthLabel(S.mes).toLowerCase()}</h2><p style="margin:0">Lance o salário, o aluguel e as outras contas. As que se repetem aparecem sozinhas nos próximos meses.</p><button class="btn primary" data-act="nova-conta">${I.plus} Lançar primeira conta</button></div>`;
    }
    const pctMerc = mt.limite ? Math.min(100, Math.round((mt.total / mt.limite) * 100)) : 0;
    const pctRes = rv.meta ? Math.min(100, Math.round((rv.estimado / rv.meta) * 100)) : 0;
    return `
    <div class="grid">
      <section class="card hero" aria-label="Sobra do mês">
        <span class="label">Sobra do mês</span>
        <span class="big num ${r.sobra >= 0 ? 'green' : 'danger'}">${brl(r.sobra)}</span>
        <div class="pair">
          <div class="pill"><span class="small muted">Receitas</span><span class="v num">${brl(r.R)}</span></div>
          <div class="pill"><span class="small muted">Despesas</span><span class="v num">${brl(r.D)}</span></div>
        </div>
        <div class="steps" aria-label="Divisão da sobra">
          <div class="st-orange"><b>1º Mercado</b><span class="num">${brl(mt.limite)}</span></div>
          <div class="st-blue"><b>2º Reserva</b><span class="num">${brl(rv.plano)}</span></div>
          <div class="${livre >= 0 ? 'st-green' : 'st-red'}"><b>${livre >= 0 ? '3º Livre' : 'Faltam'}</b><span class="num">${brl(Math.abs(livre))}</span></div>
        </div>
      </section>
      <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
        ${alerta}
        <a class="card" href="#mercado" style="color:var(--fg)">
          <div class="row"><h2>Compra do mês</h2><span class="small orange">Ver lista</span></div>
          <div class="bar"><span style="width:${pctMerc}%"></span></div>
          <div class="row small"><span class="muted num">Lista: ${brl(mt.total)}</span><b class="num ${mt.sobra >= 0 ? 'green' : 'orange'}">${mt.sobra >= 0 ? 'Sobram ' + brl(mt.sobra) : 'Passou ' + brl(-mt.sobra)}</b></div>
        </a>
        <a class="card" href="#reserva" style="color:var(--fg)">
          <div class="row"><h2>Reserva</h2><span class="small orange">Ver projeção</span></div>
          <div class="row" style="justify-content:flex-start;align-items:baseline;gap:8px"><span class="mid num blue">${brl(rv.estimado)}</span><span class="small muted">de ${brl(rv.meta)}</span></div>
          <div class="bar blue"><span style="width:${pctRes}%"></span></div>
          <span class="small muted">${rv.falta > 0 ? `Falta aportar <b class="blue num">${brl(rv.falta)}</b> este mês` : '<b class="green">Aporte do mês feito</b>'}</span>
        </a>
        ${(() => { const d = desejosPendentes()[0]; if (!d) return ''; const m = mesesPara(d.valor);
          return `<a class="card" href="#desejos" style="color:var(--fg)"><div class="row"><h2>Próximo desejo</h2><span class="small orange">Ver lista</span></div>
          <div class="row"><span class="title" style="font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h(d.nome)}</span><b class="num">${brl(d.valor)}</b></div>
          <span class="small muted">${m.txt}</span></a>`; })()}
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- Contas
  function statusConta(c) {
    if (c.natureza === 'receita') return c.pago ? ['Recebido', ''] : [`Cai dia ${c.dia}`, ''];
    if (c.pago) return ['Pago', ''];
    const d = prazo(c, S.mes);
    if (d === null) return [`Vence dia ${c.dia}`, ''];
    if (d < 0) return [S.mes < ym() ? `Atrasada · venceu ${pad(c.dia)}/${S.mes.slice(5)}` : `Atrasada · dia ${c.dia}`, 'danger'];
    if (d === 0) return ['Vence hoje', ''];
    if (d === 1) return ['Vence amanhã', ''];
    return [`Vence dia ${c.dia}`, ''];
  }
  function viewContas() {
    const r = resumo(S.mes);
    const rec = S.filtroContas === 'receita';
    const lista = (rec ? r.rec : r.des).slice().sort((a, b) => (a.pago - b.pago) || (a.dia - b.dia) || (b.valorMes - a.valorMes));
    const items = lista.map((c) => {
      const [st, cls] = statusConta(c);
      const sub = [c.tipo, c.quem, c.parcelaTxt && `parcela ${c.parcelaTxt}`].filter(Boolean).join(' · ');
      return `<div class="item ${c.pago ? 'done' : ''}">
        <button class="check ${rec ? 'rec' : ''} ${c.pago ? 'on' : ''}" data-act="pagar" data-id="${c.id}" aria-pressed="${c.pago}" aria-label="${c.pago ? 'Desmarcar' : (rec ? 'Marcar como recebida' : 'Marcar como paga')}: ${h(c.nome)}">${c.pago ? I.check : ''}</button>
        <div class="body" data-act="editar-conta" data-id="${c.id}" role="button" tabindex="0" aria-label="Editar ${h(c.nome)}"><span class="title">${h(c.nome)}</span><span class="sub">${h(sub)}${c.ajustado ? ' · valor só deste mês' : ''}</span></div>
        <div class="end"><span class="val num ${rec && !c.pago ? 'green' : ''}">${brl(c.valorMes)}</span><span class="when ${cls}">${st}</span></div>
      </div>`;
    }).join('');
    return `
      <div class="pair">
        <div class="card"><span class="small muted">${rec ? 'A receber' : 'A pagar'}</span><span class="mid num ${rec ? 'green' : 'orange'}">${brl(rec ? sum(r.rec.filter((c) => !c.pago), (c) => c.valorMes) : r.aPagar)}</span></div>
        <div class="card"><span class="small muted">${rec ? 'Recebido' : 'Pago'}</span><span class="mid num">${brl(rec ? sum(r.rec.filter((c) => c.pago), (c) => c.valorMes) : r.pago)}</span></div>
      </div>
      <div class="seg" role="group" aria-label="Mostrar">
        <button data-act="filtro" data-v="despesa" aria-pressed="${!rec}">Despesas (${r.des.length})</button>
        <button data-act="filtro" data-v="receita" aria-pressed="${rec}">Receitas (${r.rec.length})</button>
      </div>
      <div class="list">${items || `<div class="card empty"><span>Nada lançado em ${monthLabel(S.mes).toLowerCase()}.</span><button class="btn primary" data-act="nova-conta">${I.plus} Nova conta</button></div>`}</div>
      <p class="hint">Toque no quadrado para marcar como ${rec ? 'recebida' : 'paga'}. Toque no nome para mudar valor, dia de vencimento ou apagar.</p>`;
  }

  // ---------------------------------------------------------------- Mercado
  // Total da lista, fixo no topo enquanto a pessoa rola e digita valores
  function resumoMercadoFixo() {
    const t = mercadoTotais();
    const pct = t.limite ? Math.min(100, Math.round((t.total / t.limite) * 100)) : 0;
    const passou = t.sobra < 0;
    return `<div class="subbar" id="subbar-mercado" aria-live="polite">
      <div class="row"><span class="small muted">Lista de compras · ${t.ativos} ${t.ativos === 1 ? 'item' : 'itens'}</span><b class="mid num" style="font-size:20px">${brl(t.total)}</b></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="row small"><span class="muted">Limite do mês: ${brl(t.limite)}</span><b class="num ${passou ? 'orange' : 'green'}">${passou ? 'Passou ' + brl(-t.sobra) : 'Sobram ' + brl(t.sobra)}</b></div>
    </div>`;
  }
  function atualizaMercadoAoVivo() {
    const bar = $('#subbar-mercado'); if (bar) bar.outerHTML = resumoMercadoFixo();
    document.querySelectorAll('[data-subtotal]').forEach((el) => {
      el.textContent = brl(sum(S.data.mercado_itens.filter((i) => i.ativo && catDe(i) === el.dataset.subtotal), (i) => i.valor));
    });
  }
  function opcoesVolta(sel) {
    let out = `<option value="" ${!sel ? 'selected' : ''}>Aviso quando acabar</option>`;
    let m = ym();
    for (let k = 0; k < 6; k++) { m = addMonths(m, 1); out += `<option value="${m}" ${m === sel ? 'selected' : ''}>Volta em ${MESES[Number(m.slice(5)) - 1]}</option>`; }
    if (sel && sel > m) out += `<option value="${sel}" selected>Volta em ${monthLabel(sel).toLowerCase()}</option>`;
    return out;
  }
  function viewMercado() {
    const emCasa = S.abaMercado === 'casa';
    const todos = S.data.mercado_itens;
    const nLista = todos.filter((i) => i.ativo).length; const nCasa = todos.length - nLista;
    const itens = todos.filter((i) => (emCasa ? !i.ativo : i.ativo));
    const grupos = CATS.map((cat) => [cat, itens.filter((i) => catDe(i) === cat).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))]).filter(([, l]) => l.length);
    const linha = (i) => {
      const q = qtdDe(i);
      if (emCasa) {
        return `<div class="item wrap">
          <div class="body" data-act="editar-item" data-id="${i.id}" role="button" tabindex="0" aria-label="Editar ${h(i.nome)}"><span class="title">${h(i.nome)}</span><span class="sub num">${q > 1 ? q + ' un · ' : ''}${Number(i.valor) ? 'última compra: ' + brl(i.valor) : 'sem valor'}</span></div>
          ${S.v4 ? `<select class="input mini" data-change="item-volta" data-id="${i.id}" aria-label="Quando ${h(i.nome)} volta para a lista">${opcoesVolta(i.volta_em)}</select>` : ''}
          <button class="btn mini" data-act="item-acabou" data-id="${i.id}" aria-label="${h(i.nome)} acabou: voltar para a lista">Acabou</button>
        </div>`;
      }
      return `<div class="item">
        <div class="body" data-act="editar-item" data-id="${i.id}" role="button" tabindex="0" aria-label="Editar ${h(i.nome)}" style="padding-left:6px"><span class="title">${h(i.nome)}</span>${q > 1 ? `<span class="sub num">${q} un · ${brl((Number(i.valor) || 0) / q)} cada</span>` : ''}</div>
        <label class="money"><span>R$</span><input value="${fmtNum(i.valor)}" inputmode="numeric" data-money data-change="item-valor" data-id="${i.id}" aria-label="Valor total de ${h(i.nome)}"></label>
        <button class="btn mini" data-act="item-casa" data-id="${i.id}" aria-label="Já tenho ${h(i.nome)} em casa: tirar da lista">Tenho</button>
      </div>`;
    };
    const lista = grupos.map(([cat, l]) => `<div class="group-h"><span>${cat}</span>${emCasa ? `<span>${l.length}</span>` : `<span class="num" data-subtotal="${cat}">${brl(sum(l, (i) => i.valor))}</span>`}</div>${l.map(linha).join('')}`).join('');
    const vazio = emCasa
      ? '<div class="card empty"><span>Nada em casa por enquanto. Quando comprar algo que dura mais de um mês, toque em "Tenho" na lista de compras: o item vem para cá e sai da soma.</span></div>'
      : '<div class="card empty"><span>A lista de compras está vazia. Adicione o que vocês costumam comprar.</span></div>';
    return `
      ${!S.v4 && !DEMO ? '<div class="alert"><span class="ic">' + I.bell + '</span><span class="small">Para guardar categoria, quantidade e a data de volta do estoque, rode o arquivo <b>supabase/atualizacao-4-mercado-e-contas.sql</b> no Supabase. Enquanto isso, a categoria é escolhida automaticamente pelo nome.</span></div>' : ''}
      <div class="seg" role="group" aria-label="Qual lista">
        <button data-act="aba-mercado" data-v="lista" aria-pressed="${!emCasa}">Comprar (${nLista})</button>
        <button data-act="aba-mercado" data-v="casa" aria-pressed="${emCasa}">Em casa (${nCasa})</button>
      </div>
      <form class="row" data-form="item-novo" style="gap:8px">
        <input class="input" id="novo-item" name="nome" placeholder="${emCasa ? 'Adicionar ao estoque…' : 'Adicionar à lista…'}" aria-label="Nome do novo item" required autocomplete="off" style="flex:1;min-width:0">
        ${emCasa ? '' : '<input class="input" id="novo-valor" name="valor" placeholder="0,00" inputmode="numeric" data-money aria-label="Valor do item" style="width:96px;text-align:right">'}
        <button class="btn primary" type="submit" aria-label="Adicionar item" style="padding:0 14px">${I.plus}</button>
      </form>
      <div class="list">${lista || vazio}</div>
      <p class="hint">${emCasa
        ? 'Itens em casa não entram na soma. Toque em "Acabou" para o item voltar para a lista de compras, ou escolha o mês em que ele volta sozinho.'
        : 'Toque no nome para editar (nome, categoria, quantidade). Toque em "Tenho" quando já tiver o item em casa: ele sai da lista e vai para "Em casa".'}</p>`;
  }
  function sheetItem() {
    const d = S.sheet.draft;
    const q = qtdDe(d);
    const cada = (Number(d.valor) || 0) / q;
    return `<div class="sheet-head"><h2>Editar item</h2><button class="iconbtn" data-act="fechar" aria-label="Fechar">${I.x}</button></div>
      <form class="form" data-form="item">
        <div class="field"><label for="i-nome">Nome</label><input class="input" id="i-nome" name="nome" value="${h(d.nome)}" required autocomplete="off"></div>
        ${S.v4 ? `<div class="field"><span class="lbl">Categoria</span><div class="chips">${CATS.map((c) => `<button type="button" class="chip" data-act="draft" data-k="categoria" data-v="${h(c)}" aria-pressed="${d.categoria === c}">${h(c)}</button>`).join('')}</div></div>
        <div class="field"><label for="i-qtd">Quantidade</label>
          <div class="stepper"><button type="button" class="btn" data-act="qtd" data-v="-1" aria-label="Diminuir quantidade">−</button><input class="input" id="i-qtd" name="quantidade" inputmode="numeric" data-sel value="${q}"><button type="button" class="btn" data-act="qtd" data-v="1" aria-label="Aumentar quantidade">+</button></div>
        </div>` : ''}
        <div class="pair">
          ${S.v4 ? `<div class="field"><label for="i-cada">Preço de cada</label><input class="input" id="i-cada" name="cada" inputmode="numeric" data-money value="${fmtNum(cada)}"></div>` : ''}
          <div class="field"><label for="i-total">${S.v4 ? 'Total' : 'Valor'}</label><input class="input" id="i-total" name="valor" inputmode="numeric" data-money value="${fmtNum(d.valor)}"></div>
        </div>
        ${S.v4 ? '<span class="hint">Total = quantidade × preço de cada. Se os itens têm preços diferentes (por exemplo, 5 carnes por R$ 100), digite só o total.</span>' : ''}
        <div class="field"><span class="lbl">Onde está</span>
          <div class="seg" role="group" aria-label="Onde está">
            <button type="button" data-act="draft" data-k="onde" data-v="lista" aria-pressed="${d.onde !== 'casa'}">Na lista de compras</button>
            <button type="button" data-act="draft" data-k="onde" data-v="casa" aria-pressed="${d.onde === 'casa'}">Em casa</button>
          </div>
        </div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <div class="sheet-foot">
          <button class="btn primary" type="submit">Salvar</button>
          <button class="btn danger" type="button" data-act="apagar-item">${S.sheet.confirmDel ? 'Toque de novo para apagar' : 'Apagar item'}</button>
        </div>
      </form>`;
  }

  // ---------------------------------------------------------------- Reserva
  // ---------------------------------------------------------------- Desejos
  const PRIO = { alta: ['Alta', 0], media: ['Média', 1], baixa: ['Baixa', 2] };
  function desejosPendentes() {
    return S.data.desejos.filter((d) => !d.comprado)
      .sort((a, b) => (PRIO[a.prioridade]?.[1] ?? 1) - (PRIO[b.prioridade]?.[1] ?? 1) || (a.ordem || 0) - (b.ordem || 0) || String(a.criado_em).localeCompare(String(b.criado_em)));
  }
  function livrePorMes() {
    // primeiro mês (de hoje até 6 meses à frente) em que sobra dinheiro livre depois do mercado e da reserva
    const fixo = (Number(S.familia?.limite_mercado) || 0) + (Number(S.familia?.aporte_mensal) || 0);
    let m = ym();
    for (let i = 0; i < 7; i++, m = addMonths(m, 1)) {
      const r = resumo(m);
      if (!r.l.length) continue;
      const livre = r.sobra - fixo;
      if (livre > 0) return { livre, mes: m, atual: i === 0 };
    }
    return { livre: 0, mes: ym(), atual: true };
  }
  function mesesPara(valor) {
    const { livre, mes, atual } = livrePorMes(); const v = Number(valor) || 0;
    if (!v) return { n: 0, txt: 'Sem valor definido' };
    if (livre <= 0) return { n: null, txt: 'Nos próximos meses não sobra dinheiro livre depois do mercado e da reserva' };
    const n = Math.ceil(v / livre);
    const quando = atual ? 'do mês' : `de ${MESES[Number(mes.slice(5)) - 1]} em diante`;
    return { n, txt: n <= 1 ? `<b class="green">Cabe no livre ${quando}</b> (${brl(livre)})` : `Juntando o livre ${quando} (${brl(livre)}/mês), dá em <b class="green">${n} meses</b>` };
  }
  const linkSeguro = (u) => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch { return ''; } };
  function viewDesejos() {
    if (S.semDesejos) return `<div class="card empty"><h2>Falta um passo no banco de dados</h2><p style="margin:0">Para usar a lista de desejos, rode o arquivo <b>supabase/atualizacao-3-desejos.sql</b> no SQL Editor do Supabase e recarregue o app.</p></div>`;
    const pend = desejosPendentes();
    const comprados = S.data.desejos.filter((d) => d.comprado).sort((a, b) => String(b.comprado_em || '').localeCompare(String(a.comprado_em || '')));
    const total = sum(pend, (d) => d.valor);
    const prox = pend[0];
    const item = (d, i) => {
      const link = linkSeguro(d.link);
      const [plabel] = PRIO[d.prioridade] || PRIO.media;
      return `<div class="item">
        <button class="check" data-act="desejo-comprado" data-id="${d.id}" aria-label="Marcar como comprado: ${h(d.nome)}"></button>
        <div class="body" data-act="editar-desejo" data-id="${d.id}" role="button" tabindex="0">
          <span class="title">${i === 0 ? '<span class="orange">1º · </span>' : ''}${h(d.nome)}</span>
          <span class="sub">${plabel} prioridade · ${h(d.quem || 'Casa')}${link ? ' · tem link' : ''}</span>
        </div>
        <div class="end"><span class="val num">${brl(d.valor)}</span>
          <span style="display:flex;gap:0">${i > 0 ? `<button class="iconbtn" data-act="desejo-subir" data-id="${d.id}" aria-label="Subir ${h(d.nome)} na lista" style="width:36px;height:36px">${I.up}</button>` : ''}${i < pend.length - 1 ? `<button class="iconbtn" data-act="desejo-descer" data-id="${d.id}" aria-label="Descer ${h(d.nome)} na lista" style="width:36px;height:36px">${I.down}</button>` : ''}</span>
        </div>
      </div>`;
    };
    const m = prox ? mesesPara(prox.valor) : null;
    return `
      ${prox ? `<section class="card hero">
        <span class="label">Próximo da lista</span>
        <span class="mid">${h(prox.nome)}</span>
        <span class="big num">${brl(prox.valor)}</span>
        <span class="small">${m.txt}</span>
        ${linkSeguro(prox.link) ? `<a class="small" href="${h(linkSeguro(prox.link))}" target="_blank" rel="noopener noreferrer">Abrir o link do produto</a>` : ''}
      </section>` : ''}
      <button class="btn primary" data-act="novo-desejo" style="align-self:flex-start">${I.plus} Adicionar desejo</button>
      <div class="pair">
        <div class="card"><span class="small muted">Na lista</span><span class="mid num">${pend.length}</span></div>
        <div class="card"><span class="small muted">Total</span><span class="mid num">${brl(total)}</span></div>
      </div>
      <div class="list">${pend.map(item).join('') || `<div class="card empty"><span>Nenhum desejo na lista ainda. Anote o que vocês querem comprar e em que ordem.</span><button class="btn primary" data-act="novo-desejo">${I.plus} Adicionar desejo</button></div>`}</div>
      <p class="hint">Toque no quadrado quando comprar. Use as setas para mudar a ordem dentro da mesma prioridade. "Livre do mês" é o que sobra depois do mercado e do aporte na reserva.</p>
      ${comprados.length ? `<section class="card"><h2>Já compramos</h2><div class="list">${comprados.map((d) => `<div class="item done">
        <button class="check on" data-act="desejo-comprado" data-id="${d.id}" aria-label="Voltar para a lista: ${h(d.nome)}">${I.check}</button>
        <div class="body" data-act="editar-desejo" data-id="${d.id}" role="button" tabindex="0"><span class="title">${h(d.nome)}</span><span class="sub">${d.comprado_em ? 'Comprado em ' + dateBR(d.comprado_em) : 'Comprado'}</span></div>
        <span class="val num">${brl(d.valor)}</span></div>`).join('')}</div></section>` : ''}`;
  }
  function sheetDesejo() {
    const d = S.sheet.draft; const editando = !!d.id;
    const chips = (arr, key) => arr.map(([v, l]) => `<button type="button" class="chip" data-act="draft" data-k="${key}" data-v="${h(v)}" aria-pressed="${d[key] === v}">${h(l)}</button>`).join('');
    return `<div class="sheet-head"><h2>${editando ? 'Editar desejo' : 'Novo desejo'}</h2><button class="iconbtn" data-act="fechar" aria-label="Fechar">${I.x}</button></div>
      <form class="form" data-form="desejo">
        <div class="field" style="align-items:center"><label for="d-valor">Quanto custa (mais ou menos)</label><input class="input bigvalue num" id="d-valor" name="valor" inputmode="numeric" data-money value="${d.valor ? fmtNum(d.valor) : ''}" placeholder="0,00"></div>
        <div class="field"><label for="d-nome">O que é</label><input class="input" id="d-nome" name="nome" value="${h(d.nome)}" placeholder="Ex.: Ar-condicionado do quarto" required></div>
        <div class="field"><span class="lbl">Prioridade</span><div class="chips">${chips([['alta', 'Alta'], ['media', 'Média'], ['baixa', 'Baixa']], 'prioridade')}</div></div>
        <div class="field"><span class="lbl">Para quem</span><div class="chips">${chips(quemOpcoes().map((q) => [q, q]), 'quem')}</div></div>
        <div class="field"><label for="d-link">Link do produto (opcional)</label><input class="input" id="d-link" name="link" type="url" inputmode="url" value="${h(d.link)}" placeholder="https://..."></div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <div class="sheet-foot">
          <button class="btn primary" type="submit">Salvar</button>
          ${editando ? `<button class="btn danger" type="button" data-act="apagar-desejo">${S.sheet.confirmDel ? 'Toque de novo para apagar' : 'Apagar'}</button>` : ''}
        </div>
      </form>`;
  }

  function viewReserva() {
    const rv = reservaTotais();
    const proj = projecao(rv.estimado, rv.plano);
    const max = Math.max(rv.meta, ...proj.map((p) => p.v), 1);
    const goalPct = rv.meta ? (rv.meta / max) * 100 : 0;
    const cdi = S.cdi;
    const cdiTxt = cdi ? (cdi.fonte === 'bcb' ? `CDI hoje: ${fmtNum(cdi.anual)}% ao ano · fonte: Banco Central` : `CDI estimado: ${fmtNum(cdi.anual)}% ao ano (sem resposta do Banco Central agora)`) : 'Buscando o CDI no Banco Central…';
    const quando = proj.find((p) => p.v >= rv.meta);
    const apls = rv.infos.map((i) => `<div class="item">
        <div class="body" data-act="editar-aplicacao" data-id="${i.a.id}" role="button" tabindex="0" style="padding-left:6px"><span class="title">${h(i.a.nome)}</span><span class="sub">${h(i.a.instituicao || '')}${i.a.instituicao ? ' · ' : ''}${fmtNum(i.a.pct_cdi)}% do CDI</span></div>
        <div class="end"><span class="val num blue">${brl(i.estimado)}</span><span class="sub num">rendeu ${brl(i.rendeu)}</span></div>
      </div>`).join('');
    const aportes = S.data.aportes.slice().sort((a, b) => String(b.data).localeCompare(String(a.data))).slice(0, 12).map((x) => {
      const a = S.data.aplicacoes.find((p) => p.id === x.aplicacao_id);
      return `<div class="item"><div class="body" style="padding-left:6px;cursor:default"><span class="title">${h(a ? a.nome : 'Aplicação')}</span><span class="sub">${dateBR(x.data)}</span></div>
        <span class="val num blue">+${brl(x.valor)}</span><button class="iconbtn" data-act="aporte-del" data-id="${x.id}" aria-label="Apagar aporte de ${dateBR(x.data)}">${I.trash}</button></div>`;
    }).join('');
    return `
    <div class="grid">
      <section class="card blue-top">
        <span class="label">Total investido (estimado hoje)</span>
        <span class="big num blue">${brl(rv.estimado)}</span>
        <div class="pair">
          <div class="pill"><span class="small muted">Colocado</span><span class="v num blue">${brl(rv.aportado)}</span></div>
          <div class="pill"><span class="small muted">Rendeu</span><span class="v num blue">${brl(rv.rendeu)}</span></div>
        </div>
        <span class="small muted">${h(cdiTxt)}</span>
        <div class="row" style="flex-wrap:wrap;gap:8px">
          <button class="btn blue" data-act="novo-aporte" ${S.data.aplicacoes.length ? '' : 'disabled'}>${I.plus} Registrar aporte</button>
          <button class="btn ghost" data-act="nova-aplicacao">Nova aplicação</button>
        </div>
        ${rv.falta > 0 ? `<span class="small">Falta aportar <b class="blue num">${brl(rv.falta)}</b> em ${monthLabel(ym()).toLowerCase()} (meta: ${brl(rv.plano)}/mês).</span>` : `<span class="small green"><b>Aporte de ${monthLabel(ym()).toLowerCase()} feito.</b></span>`}
      </section>
      <section class="card">
        <div class="row"><h2>Projeção · 12 meses</h2><span class="small muted">+${brl(rv.plano)}/mês</span></div>
        <div class="chart" role="img" aria-label="Reserva estimada sobe de ${brl(proj[0].v)} para ${brl(proj[11].v)} em 12 meses">
          ${rv.meta ? `<div class="goal" style="bottom:${goalPct}%"><span>Meta ${brl(rv.meta)}</span></div>` : ''}
          ${proj.map((p) => `<div class="b" style="height:${(p.v / max) * 100}%" title="${monthLabel(p.m)}: ${brl(p.v)}"></div>`).join('')}
        </div>
        <div class="chart-x">${proj.map((p) => `<span>${monthShort(p.m)}</span>`).join('')}</div>
        <span class="small muted">${quando ? `Chega na meta em <b class="blue">${monthLabel(quando.m).toLowerCase()}</b>.` : 'Com esse aporte, a meta passa de 12 meses.'} Estimativa bruta, antes do imposto.</span>
      </section>
    </div>
    <section class="card">
      <h2>Regra do salário</h2>
      <div class="steps">
        <div class="st-orange"><b>1º</b>Separar o mercado</div>
        <div class="st-blue"><b>2º</b>Aporte na reserva</div>
        <div class="st-green"><b>3º</b>O resto é livre</div>
      </div>
    </section>
    <section class="card"><h2>Onde está o dinheiro</h2><div class="list">${apls || '<span class="muted small">Nenhuma aplicação ainda. Toque em "Nova aplicação".</span>'}</div>
      <span class="hint">Toque numa aplicação para conferir o saldo pelo extrato do banco.</span></section>
    ${aportes ? `<section class="card"><h2>Últimos aportes</h2><div class="list">${aportes}</div></section>` : ''}`;
  }

  // ---------------------------------------------------------------- Ajustes
  function viewAjustes() {
    const f = S.familia || {};
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const tema = lsGet('casa-tema') || 'auto';
    return `
    <div class="grid">
      <form class="card form" data-form="ajustes-familia">
        <h2>Família</h2>
        <div class="field"><label for="aj-sob">Sobrenome</label><input class="input" id="aj-sob" name="sobrenome" value="${h(f.sobrenome)}" required></div>
        <div class="field"><label for="aj-nome">Seu nome</label><input class="input" id="aj-nome" name="nome" value="${h(S.membro?.nome)}" required></div>
        <div class="field"><label for="aj-lim">Limite do mercado por mês</label><input class="input" id="aj-lim" name="limite_mercado" inputmode="numeric" data-money value="${fmtNum(f.limite_mercado)}"></div>
        <div class="field"><label for="aj-ap">Aporte na reserva por mês</label><input class="input" id="aj-ap" name="aporte_mensal" inputmode="numeric" data-money value="${fmtNum(f.aporte_mensal)}"></div>
        <div class="field"><label for="aj-meta">Meta da reserva</label><input class="input" id="aj-meta" name="meta_reserva" inputmode="numeric" data-money value="${fmtNum(f.meta_reserva)}"></div>
        <button class="btn primary" type="submit">Salvar</button>
      </form>
      <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
        <section class="card">
          <h2>Convidar alguém da casa</h2>
          <span class="small muted">Na tela de cadastro, a pessoa cria a conta, escolhe "Tenho um código" e digita:</span>
          <div class="row"><span class="mid" style="letter-spacing:.15em;user-select:all">${h(f.codigo_convite)}</span><button class="btn" data-act="copiar-codigo">Copiar</button></div>
          <span class="small muted">Na família: ${S.membros.map((m) => h(m.nome)).join(', ')}</span>
        </section>
        <section class="card">
          <h2>Avisos de vencimento</h2>
          <span class="small muted">Quando você abrir o app, ele avisa das contas que vencem em até 3 dias ou estão atrasadas.</span>
          ${perm === 'granted' ? '<b class="green small">Avisos ligados neste aparelho.</b>'
            : perm === 'denied' ? '<span class="small">Os avisos estão bloqueados neste navegador. Libere nas configurações do site.</span>'
            : perm === 'unsupported' ? '<span class="small">No iPhone, os avisos funcionam depois de adicionar o app à Tela de Início.</span>'
            : '<button class="btn primary" data-act="ativar-avisos">Ativar avisos</button>'}
        </section>
        <section class="card">
          <h2>Instalar no celular</h2>
          ${S.installEvt ? '<button class="btn primary" data-act="instalar">Instalar Ca$a</button>' : ''}
          <span class="small"><b>Android:</b> no Chrome ou no Firefox, menu ⋮ › "Instalar app" ou "Adicionar à tela inicial".</span>
          <span class="small"><b>iPhone:</b> no Safari, botão Compartilhar › "Adicionar à Tela de Início".</span>
          <span class="small"><b>PC:</b> é só abrir o endereço no navegador e salvar nos favoritos.</span>
        </section>
        <section class="card">
          <h2>Aparência</h2>
          <div class="seg" role="group" aria-label="Tema">
            <button data-act="tema" data-v="auto" aria-pressed="${tema === 'auto'}">Automático</button>
            <button data-act="tema" data-v="dark" aria-pressed="${tema === 'dark'}">Escuro</button>
            <button data-act="tema" data-v="light" aria-pressed="${tema === 'light'}">Claro</button>
          </div>
        </section>
        <section class="card">
          <h2>Sua conta</h2>
          <a class="small" href="privacidade.html">Privacidade e termos de uso</a>
          <button class="btn" data-act="logout">Sair da conta</button>
          ${S.confirmExcluir ? `
          <form class="form" data-form="excluir-usuario" style="border:1px solid var(--danger);border-radius:12px;padding:12px;gap:10px">
            <b class="danger">Isso apaga a sua conta para sempre.</b>
            <span class="small">Se você for a última pessoa da família, todas as contas, a lista e os investimentos também somem. Não dá para desfazer.</span>
            <div class="field"><label for="conf-excluir">Para confirmar, digite EXCLUIR</label><input class="input" id="conf-excluir" name="confirmacao" autocomplete="off" autocapitalize="characters"></div>
            <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn danger" type="submit">Excluir para sempre</button><button class="btn" type="button" data-act="cancelar-excluir-usuario">Cancelar</button></div>
          </form>` : '<button class="btn danger" data-act="excluir-usuario">Excluir minha conta e meus dados</button>'}
          <span class="hint">Se você for a última pessoa da família, todas as contas, a lista e os investimentos da família também são apagados.</span>
        </section>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- folhas (formulários)
  function quemOpcoes() {
    const set = new Set(['Casa', ...S.membros.map((m) => m.nome), ...S.data.contas.map((c) => c.quem)].filter(Boolean));
    return [...set];
  }
  const TIPOS = { despesa: ['Fixa', 'Cartão', 'Parcela', 'Mercado', 'Outros'], receita: ['Salário', 'Extra', 'Outros'] };
  // Mês sugerido para uma conta nova: se o dia já passou neste mês, a primeira vence no mês que vem
  function inicioSugerido(dia, natureza) {
    if (natureza === 'despesa' && S.mes === ym() && (Number(dia) || 0) < new Date().getDate()) return addMonths(S.mes, 1);
    return S.mes;
  }
  function hintInicio(d) {
    const dia = Math.max(1, Math.min(31, parseInt(d.dia, 10) || 1));
    const ini = d.inicio || S.mes;
    const data = `${pad(Math.min(dia, daysInMonth(ini)))}/${ini.slice(5)}/${ini.slice(0, 4)}`;
    if (d.natureza === 'receita') return `Entra pela primeira vez em ${data}.`;
    let t = `Primeiro vencimento: ${data}.`;
    if (!d.id && d.inicioAuto && ini !== S.mes) t += ` O dia ${dia} de ${MESES[Number(S.mes.slice(5)) - 1]} já passou, por isso começa em ${MESES[Number(ini.slice(5)) - 1]}. Se ainda vai pagar a de ${MESES[Number(S.mes.slice(5)) - 1]}, troque o mês acima.`;
    return t;
  }
  function opcoesMes(sel) {
    const hoje = ym();
    let m = [sel, S.mes, addMonths(hoje, -12)].sort()[0];
    const fim = addMonths([hoje, S.mes, sel].sort()[2], 12);
    let out = '';
    for (; m <= fim; m = addMonths(m, 1)) out += `<option value="${m}" ${m === sel ? 'selected' : ''}>${monthLabel(m)}</option>`;
    return out;
  }
  function sheetConta() {
    const d = S.sheet.draft;
    const nat = d.natureza;
    const chips = (arr, key) => arr.map((v) => `<button type="button" class="chip" data-act="draft" data-k="${key}" data-v="${h(v)}" aria-pressed="${d[key] === v}">${h(v)}</button>`).join('');
    const rep = [['mensal', 'Todo mês'], ['unica', 'Uma vez só'], ['parcelado', 'Parcelado']];
    const editando = !!d.id;
    const podeEncerrar = editando && d.recorrencia !== 'unica' && S.mes > d.inicio;
    const escolheEscopo = editando && S.v4 && d.recorrencia !== 'unica';
    const mesCurto = monthShort(S.mes);
    return `<div class="sheet-head"><h2>${editando ? 'Editar' : 'Nova'} ${nat === 'receita' ? 'receita' : 'conta'}</h2><button class="iconbtn" data-act="fechar" aria-label="Fechar">${I.x}</button></div>
      <form class="form" data-form="conta">
        <div class="seg nat" role="group" aria-label="Tipo de lançamento">
          <button type="button" data-act="draft" data-k="natureza" data-v="despesa" aria-pressed="${nat === 'despesa'}">Despesa</button>
          <button type="button" data-act="draft" data-k="natureza" data-v="receita" aria-pressed="${nat === 'receita'}">Receita</button>
        </div>
        <div class="field" style="align-items:center"><label for="c-valor">Valor${editando && d.recorrencia !== 'unica' ? ` em ${monthLabel(S.mes).toLowerCase()}` : ''}</label><input class="input bigvalue num ${nat === 'receita' ? 'green' : ''}" id="c-valor" name="valor" inputmode="numeric" data-money value="${d.valor ? fmtNum(d.valor) : ''}" placeholder="0,00" required>
          ${escolheEscopo ? `<div class="seg" role="group" aria-label="Se mudar o valor, vale para" style="width:100%">
            <button type="button" data-act="draft" data-k="escopo" data-v="mes" aria-pressed="${d.escopo === 'mes'}">Só em ${mesCurto}</button>
            <button type="button" data-act="draft" data-k="escopo" data-v="sempre" aria-pressed="${d.escopo !== 'mes'}">Todos os meses</button>
          </div><span class="hint">${d.escopo === 'mes' ? `Se mudar o valor, muda só em ${monthLabel(S.mes).toLowerCase()} (bom para conta de luz, água, cartão).` : 'Se mudar o valor, vale para todos os meses que ainda não foram pagos.'}</span>` : ''}
        </div>
        <div class="two">
          <div class="field"><label for="c-nome">Descrição</label><input class="input" id="c-nome" name="nome" value="${h(d.nome)}" placeholder="${nat === 'receita' ? 'Ex.: Salário' : 'Ex.: Conta de luz'}" required></div>
          <div class="field"><label for="c-dia">${nat === 'receita' ? 'Cai dia' : 'Vence dia'}</label><input class="input" id="c-dia" name="dia" inputmode="numeric" data-sel value="${h(d.dia)}" required></div>
        </div>
        <div class="field"><label for="c-inicio">${d.recorrencia === 'unica' ? 'Em qual mês' : (nat === 'receita' ? 'Começa em' : 'Primeiro vencimento em')}</label>
          <select class="input" id="c-inicio" name="inicio">${opcoesMes(d.inicio || S.mes)}</select>
          <span class="hint" id="c-inicio-hint">${hintInicio(d)}</span>
        </div>
        <div class="field"><span class="lbl">Tipo</span><div class="chips">${chips(TIPOS[nat], 'tipo')}</div></div>
        <div class="field"><span class="lbl">De quem é</span><div class="chips">${chips(quemOpcoes(), 'quem')}</div></div>
        <div class="field"><span class="lbl">Repetir</span>
          <div class="seg" role="group" aria-label="Repetir">${rep.map(([v, l]) => `<button type="button" data-act="draft" data-k="recorrencia" data-v="${v}" aria-pressed="${d.recorrencia === v}">${l}</button>`).join('')}</div>
          ${d.recorrencia === 'parcelado' ? `<div class="two" style="margin-top:6px"><label for="c-parc" class="lbl" style="align-self:center">Número de parcelas</label><input class="input" id="c-parc" name="parcelas" inputmode="numeric" data-sel value="${h(d.parcelas || 2)}"></div>` : ''}
        </div>
        ${S.msg ? `<p class="error" role="alert">${h(S.msg)}</p>` : ''}
        <div class="sheet-foot">
          <button class="btn primary" type="submit">Salvar</button>
          ${podeEncerrar ? `<button class="btn" type="button" data-act="encerrar-conta">Parar a partir de ${mesCurto}</button>` : ''}
          ${editando ? `<button class="btn danger" type="button" data-act="excluir-conta">${S.sheet.confirmDel ? 'Toque de novo para apagar' : 'Apagar de todos os meses'}</button>` : ''}
        </div>
      </form>`;
  }
  function sheetAporte() {
    const d = S.sheet.draft;
    return `<div class="sheet-head"><h2>Registrar aporte</h2><button class="iconbtn" data-act="fechar" aria-label="Fechar">${I.x}</button></div>
      <form class="form" data-form="aporte">
        <div class="field" style="align-items:center"><label for="a-valor">Valor colocado</label><input class="input bigvalue num blue" id="a-valor" name="valor" inputmode="numeric" data-money placeholder="0,00" value="${d.valor ? fmtNum(d.valor) : ''}" required></div>
        <div class="field"><label for="a-apl">Aplicação</label><select class="input" id="a-apl" name="aplicacao_id">${S.data.aplicacoes.map((a) => `<option value="${a.id}">${h(a.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="a-data">Data</label><input class="input" id="a-data" name="data" type="date" value="${todayISO()}" required></div>
        <div class="sheet-foot"><button class="btn blue" type="submit">Salvar aporte</button></div>
      </form>`;
  }
  function sheetAplicacao() {
    const d = S.sheet.draft; const editando = !!d.id;
    const info = editando ? aplicacaoInfo(d) : null;
    return `<div class="sheet-head"><h2>${editando ? 'Aplicação' : 'Nova aplicação'}</h2><button class="iconbtn" data-act="fechar" aria-label="Fechar">${I.x}</button></div>
      <form class="form" data-form="aplicacao">
        <div class="field"><label for="p-nome">Nome</label><input class="input" id="p-nome" name="nome" value="${h(d.nome)}" placeholder="Ex.: Reserva de emergência" required></div>
        <div class="two">
          <div class="field"><label for="p-inst">Onde (banco / produto)</label><input class="input" id="p-inst" name="instituicao" value="${h(d.instituicao)}" placeholder="Ex.: CDB do Nubank"></div>
          <div class="field"><label for="p-pct">% do CDI</label><input class="input" id="p-pct" name="pct_cdi" inputmode="decimal" value="${fmtNum(d.pct_cdi ?? 100)}"></div>
        </div>
        <div class="field"><label for="p-saldo">${editando ? 'Saldo no extrato hoje' : 'Quanto já tem aplicado hoje'}</label><input class="input" id="p-saldo" name="saldo" inputmode="numeric" data-money placeholder="${editando ? fmtNum(info.estimado) : '0,00'}" value="${editando ? '' : fmtNum(d.saldo_base || 0)}">
          <span class="hint">${editando ? `O app estima ${brl(info.estimado)}. Se o extrato mostrar outro valor, digite aqui e ele passa a contar a partir de hoje. Deixe vazio para não mudar.` : 'Os aportes que você registrar depois somam em cima desse valor.'}</span></div>
        <div class="sheet-foot">
          <button class="btn primary" type="submit">Salvar</button>
          ${editando ? `<button class="btn danger" type="button" data-act="excluir-aplicacao">${S.sheet.confirmDel ? 'Toque de novo para apagar' : 'Apagar'}</button>` : ''}
        </div>
      </form>`;
  }
  function renderSheet() {
    let root = $('#sheet-root');
    if (!root) { root = document.createElement('div'); root.id = 'sheet-root'; document.body.appendChild(root); }
    if (!S.sheet) { root.innerHTML = ''; document.body.style.overflow = ''; return; }
    const html = S.sheet.type === 'conta' ? sheetConta() : S.sheet.type === 'aporte' ? sheetAporte() : S.sheet.type === 'desejo' ? sheetDesejo() : S.sheet.type === 'item' ? sheetItem() : sheetAplicacao();
    root.innerHTML = `<div class="sheet-back" data-act="fechar-fora"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
    document.body.style.overflow = 'hidden';
  }
  function syncDraft() {
    const form = $('#sheet-root form'); if (!form || !S.sheet) return;
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      if (k === 'valor') S.sheet.draft.valor = parseMoney(v);
      else if (k === 'saldo') S.sheet.draft.saldoTxt = v;
      else S.sheet.draft[k] = v;
    }
  }
  function openSheet(type, draft) { S.msg = ''; S.sheet = { type, draft, confirmDel: false }; const tt = $('#toast'); if (tt) tt.hidden = true; renderSheet(); setTimeout(() => { const f = $('#sheet-root input:not([type=hidden])'); if (f && matchMedia('(min-width: 900px)').matches) f.focus(); }, 30); }
  function closeSheet() { S.sheet = null; S.msg = ''; renderSheet(); if (S.pendingRender) render(); if (typeof checarVersao === 'function') setTimeout(checarVersao, 500); }

  // ---------------------------------------------------------------- render
  function render() {
    S.pendingRender = false;
    const app = $('#app');
    if (S.phase === 'loading') return;
    if (S.phase === 'auth') { app.innerHTML = authScreen(); return; }
    if (S.phase === 'recovery') { app.innerHTML = recoveryScreen(); return; }
    if (S.phase === 'onboarding') { app.innerHTML = onboardingScreen(); return; }
    const views = { painel: viewPainel, contas: viewContas, mercado: viewMercado, desejos: viewDesejos, reserva: viewReserva, ajustes: viewAjustes };
    const scroll = window.scrollY;
    app.innerHTML = shell(views[S.view]());
    window.scrollTo(0, scroll);
    document.title = S.familia ? `Ca$a ${S.familia.sobrenome}` : 'Ca$a';
  }
  function safeRender() {
    const a = document.activeElement;
    if (S.sheet || (a && a.closest && a.closest('#app') && (a.tagName === 'INPUT' || a.tagName === 'SELECT'))) { S.pendingRender = true; return; }
    render();
  }
  document.addEventListener('focusout', () => { if (S.pendingRender && !S.sheet) setTimeout(safeRender, 50); });

  function aplicarTema() {
    const t = lsGet('casa-tema') || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
    const escuro = t === 'dark' || (t === 'auto' && !matchMedia('(prefers-color-scheme: light)').matches);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute('content', escuro ? '#0D0D0D' : '#FFFFFF');
  }

  // ---------------------------------------------------------------- ações
  const actions = {
    'auth-view': (el) => { S.authView = el.dataset.v; S.msg = ''; render(); },
    'onb-tab': (el) => { S.onboardTab = el.dataset.v; S.msg = ''; render(); },
    logout: async () => { await API.signOut(); S.phase = 'auth'; S.authView = 'login'; S.familia = null; S.membro = null; lsDel('casa-view'); render(); },
    mes: (el) => { S.mes = addMonths(S.mes, Number(el.dataset.v)); render(); },
    filtro: (el) => { S.filtroContas = el.dataset.v; render(); },
    'nova-conta': () => {
      const rec = S.view === 'contas' && S.filtroContas === 'receita';
      const hoje = S.mes === ym() ? new Date().getDate() : 10;
      const nat = rec ? 'receita' : 'despesa';
      openSheet('conta', { natureza: nat, valor: 0, nome: '', dia: hoje, tipo: rec ? 'Salário' : 'Fixa', quem: 'Casa', recorrencia: 'mensal', parcelas: 2, inicio: inicioSugerido(hoje, nat), inicioAuto: true });
    },
    'editar-conta': (el) => {
      const c = S.data.contas.find((x) => x.id === el.dataset.id); if (!c) return;
      const cm = contasDoMes(S.mes).find((x) => x.id === c.id);
      const valor = cm ? cm.valorMes : Number(c.valor);
      openSheet('conta', { ...c, valor, valor0: valor, escopo: cm && cm.ajustado ? 'mes' : 'sempre' });
    },
    'ir-mes': (el) => { S.mes = el.dataset.mes; S.filtroContas = 'despesa'; if (S.view === 'contas') render(); else location.hash = 'contas'; },
    draft: (el) => {
      syncDraft();
      const k = el.dataset.k; const v = el.dataset.v;
      const d = S.sheet.draft;
      d[k] = v;
      if (k === 'natureza' && !TIPOS[v].includes(d.tipo)) d.tipo = TIPOS[v][0];
      if (S.sheet.type === 'conta' && !d.id && d.inicioAuto) d.inicio = inicioSugerido(d.dia, d.natureza);
      renderSheet();
    },
    fechar: () => closeSheet(),
    'fechar-fora': (el, ev) => { if (ev.target === el) closeSheet(); },
    pagar: (el) => {
      const id = el.dataset.id;
      const c = contasDoMes(S.mes).find((x) => x.id === id); if (!c) return;
      const p = S.data.pagamentos.find((x) => x.conta_id === id && x.mes === S.mes);
      if (c.pago) { if (p && p.ajustado) upd('pagamentos', p.id, { pago: false }); else if (p) del('pagamentos', p.id); }
      else if (p) upd('pagamentos', p.id, { pago: true });
      else ins('pagamentos', { conta_id: id, mes: S.mes, valor: c.valorMes, pago: true, ajustado: false });
      render();
    },
    'encerrar-conta': () => {
      const d = S.sheet.draft;
      upd('contas', d.id, { fim: addMonths(S.mes, -1) });
      closeSheet(); render(); toast(`${d.nome} não aparece mais a partir de ${monthLabel(S.mes).toLowerCase()}.`);
    },
    'excluir-conta': () => {
      if (!S.sheet.confirmDel) { syncDraft(); S.sheet.confirmDel = true; renderSheet(); return; }
      const d = S.sheet.draft; del('contas', d.id); closeSheet(); render(); toast('Conta apagada.');
    },
    'aba-mercado': (el) => { S.abaMercado = el.dataset.v; render(); },
    'item-casa': (el) => {
      const i = S.data.mercado_itens.find((x) => x.id === el.dataset.id); if (!i) return;
      upd('mercado_itens', i.id, { ativo: false, volta_em: null }); render();
      toast(`${i.nome} saiu da lista e foi para "Em casa".`);
    },
    'item-acabou': (el) => {
      const i = S.data.mercado_itens.find((x) => x.id === el.dataset.id); if (!i) return;
      upd('mercado_itens', i.id, { ativo: true, volta_em: null }); render();
      toast(`${i.nome} voltou para a lista de compras.`);
    },
    'editar-item': (el) => {
      const i = S.data.mercado_itens.find((x) => x.id === el.dataset.id); if (!i) return;
      openSheet('item', { ...i, valor: Number(i.valor) || 0, quantidade: qtdDe(i), categoria: catDe(i), onde: i.ativo ? 'lista' : 'casa' });
    },
    qtd: (el) => {
      syncDraft();
      const d = S.sheet.draft;
      const cada = parseMoney(d.cada);
      const q = Math.max(1, (parseInt(d.quantidade, 10) || 1) + Number(el.dataset.v));
      d.quantidade = q; d.valor = Math.round(q * cada * 100) / 100;
      renderSheet();
    },
    'apagar-item': () => {
      if (!S.sheet.confirmDel) { syncDraft(); S.sheet.confirmDel = true; renderSheet(); return; }
      const d = S.sheet.draft; del('mercado_itens', d.id); closeSheet(); render(); toast(`${d.nome} apagado.`);
    },
    'novo-aporte': () => openSheet('aporte', { valor: S.familia?.aporte_mensal || 0 }),
    'novo-desejo': () => openSheet('desejo', { nome: '', valor: 0, prioridade: 'media', quem: 'Casa', link: '' }),
    'editar-desejo': (el) => { const d = S.data.desejos.find((x) => x.id === el.dataset.id); if (d) openSheet('desejo', { ...d, valor: Number(d.valor) }); },
    'desejo-comprado': (el) => {
      const d = S.data.desejos.find((x) => x.id === el.dataset.id); if (!d) return;
      upd('desejos', d.id, d.comprado ? { comprado: false, comprado_em: null } : { comprado: true, comprado_em: todayISO() });
      render(); if (!d.comprado) return; toast(`${d.nome} foi para "Já compramos".`);
    },
    'desejo-subir': (el) => moverDesejo(el.dataset.id, -1),
    'desejo-descer': (el) => moverDesejo(el.dataset.id, 1),
    'apagar-desejo': () => {
      if (!S.sheet.confirmDel) { syncDraft(); S.sheet.confirmDel = true; renderSheet(); return; }
      del('desejos', S.sheet.draft.id); closeSheet(); render(); toast('Desejo apagado.');
    },
    'nova-aplicacao': () => openSheet('aplicacao', { nome: '', instituicao: '', pct_cdi: 100, saldo_base: 0 }),
    'editar-aplicacao': (el) => { const a = S.data.aplicacoes.find((x) => x.id === el.dataset.id); if (a) openSheet('aplicacao', { ...a }); },
    'excluir-aplicacao': () => {
      if (!S.sheet.confirmDel) { syncDraft(); S.sheet.confirmDel = true; renderSheet(); return; }
      del('aplicacoes', S.sheet.draft.id); closeSheet(); render(); toast('Aplicação apagada.');
    },
    'aporte-del': (el) => { del('aportes', el.dataset.id); render(); },
    'copiar-codigo': async () => {
      const code = S.familia?.codigo_convite || '';
      try { await navigator.clipboard.writeText(code); toast('Código copiado.'); } catch { toast('Código: ' + code); }
    },
    'ativar-avisos': async () => {
      try { await Notification.requestPermission(); } catch { /* sem suporte */ }
      render(); avisarVencimentos();
    },
    instalar: async () => { if (!S.installEvt) return; S.installEvt.prompt(); await S.installEvt.userChoice.catch(() => {}); S.installEvt = null; render(); },
    tema: (el) => { lsSet('casa-tema', el.dataset.v); aplicarTema(); render(); },
    'tema-toggle': () => { lsSet('casa-tema', temaEscuro() ? 'light' : 'dark'); aplicarTema(); render(); },
    'excluir-usuario': () => { S.confirmExcluir = true; render(); const f = $('#conf-excluir'); if (f) f.focus(); },
    'cancelar-excluir-usuario': () => { S.confirmExcluir = false; render(); }
  };
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]'); if (!el) return;
    const fn = actions[el.dataset.act]; if (!fn) return;
    if (el.tagName === 'A') ev.preventDefault();
    fn(el, ev);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && S.sheet) closeSheet();
    if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-act]')) { ev.preventDefault(); ev.target.click(); }
  });
  // Ao tocar num campo de valor ou número, seleciona tudo: é só digitar por cima
  const selecionavel = (el) => el && el.matches && el.matches('input[data-money], input[data-sel]');
  document.addEventListener('focusin', (ev) => {
    const el = ev.target; if (!selecionavel(el)) return;
    el.dataset.recemFocado = '1';
    try { el.select(); } catch { /* sem seleção */ }
  });
  // O clique que deu o foco colocaria o cursor no meio do texto: refaz a seleção uma vez
  document.addEventListener('click', (ev) => {
    const el = ev.target; if (!selecionavel(el) || !el.dataset.recemFocado) return;
    delete el.dataset.recemFocado;
    try { el.select(); } catch { /* sem seleção */ }
  });
  document.addEventListener('focusout', (ev) => { if (selecionavel(ev.target)) delete ev.target.dataset.recemFocado; });
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.live === 'sobrenome') { const pv = $('#pv-sobrenome'); if (pv) pv.textContent = el.value.trim() || 'Sua família'; }
    // Campo de dinheiro: digita só os números e a vírgula entra sozinha (2890 vira 28,90)
    if (el.matches('input[data-money]')) {
      const dg = el.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
      el.value = dg ? fmtNum(parseInt(dg, 10) / 100) : '';
    }
    if (el.dataset.change === 'item-valor') {
      const it = S.data.mercado_itens.find((x) => x.id === el.dataset.id);
      if (it) { it.valor = parseMoney(el.value); atualizaMercadoAoVivo(); }
    }
    if (S.sheet && S.sheet.type === 'conta' && el.id === 'c-dia') {
      const d = S.sheet.draft; d.dia = el.value;
      if (!d.id && d.inicioAuto) { d.inicio = inicioSugerido(d.dia, d.natureza); const sel = $('#c-inicio'); if (sel) sel.value = d.inicio; }
      const hint = $('#c-inicio-hint'); if (hint) hint.textContent = hintInicio(d);
    }
    if (S.sheet && S.sheet.type === 'item' && ['i-qtd', 'i-cada', 'i-total'].includes(el.id)) {
      const q = Math.max(1, parseInt($('#i-qtd')?.value, 10) || 1);
      const cadaEl = $('#i-cada'); const totEl = $('#i-total');
      if (cadaEl && totEl) {
        if (el.id === 'i-total') cadaEl.value = fmtNum(parseMoney(totEl.value) / q);
        else totEl.value = fmtNum(Math.round(q * parseMoney(cadaEl.value) * 100) / 100);
      }
    }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.change === 'item-valor') {
      const v = parseMoney(el.value); upd('mercado_itens', el.dataset.id, { valor: v }); el.value = fmtNum(v);
      atualizaMercadoAoVivo();
      S.pendingRender = true; setTimeout(safeRender, 0);
    }
    if (el.dataset.change === 'item-volta') {
      upd('mercado_itens', el.dataset.id, { volta_em: el.value || null });
      S.pendingRender = true; setTimeout(safeRender, 0);
    }
    if (S.sheet && S.sheet.type === 'conta' && el.id === 'c-inicio') {
      const d = S.sheet.draft; d.inicio = el.value; d.inicioAuto = false;
      const hint = $('#c-inicio-hint'); if (hint) hint.textContent = hintInicio(d);
    }
  });

  function moverDesejo(id, dir) {
    const lista = desejosPendentes();
    const i = lista.findIndex((d) => d.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= lista.length) return;
    // renumera a lista inteira e troca os dois de lugar (passa para a prioridade do vizinho)
    const nova = lista.slice(); [nova[i], nova[j]] = [nova[j], nova[i]];
    const prioVizinho = lista[j].prioridade;
    nova.forEach((d, k) => {
      const patch = {};
      if ((d.ordem || 0) !== k + 1) patch.ordem = k + 1;
      if (d.id === id && d.prioridade !== prioVizinho) patch.prioridade = prioVizinho;
      if (Object.keys(patch).length) upd('desejos', d.id, patch);
    });
    render();
  }

  const forms = {
    async login(fd) { await API.signIn(fd.get('email').trim(), fd.get('senha')); await boot(); },
    async signup(fd) {
      const logged = await API.signUp(fd.get('email').trim(), fd.get('senha'), fd.get('nome').trim());
      if (logged) { await boot(); return; }
      S.authView = 'sent'; S.msg = `Enviamos um link de confirmação para ${fd.get('email').trim()}. Abra o e-mail, confirme e depois entre com sua senha.`; render();
    },
    async forgot(fd) {
      await API.resetPassword(fd.get('email').trim());
      S.authView = 'sent'; S.msg = 'Se esse e-mail tiver conta, chega um link para criar uma nova senha.'; render();
    },
    async newpass(fd) { await API.updatePassword(fd.get('senha')); S.msg = ''; toast('Senha alterada.'); await boot(); },
    async 'criar-familia'(fd) { await API.criarFamilia(fd.get('sobrenome').trim(), fd.get('nome').trim()); await boot(); },
    async 'entrar-familia'(fd) { await API.entrarFamilia(fd.get('codigo').trim(), fd.get('nome').trim()); await boot(); },
    async conta(fd) {
      syncDraft();
      const d = S.sheet.draft;
      const valor = parseMoney(fd.get('valor'));
      const dia = Math.max(1, Math.min(31, parseInt(fd.get('dia'), 10) || 10));
      const nome = String(fd.get('nome') || '').trim();
      if (!nome) { S.msg = 'Escreva a descrição.'; renderSheet(); return; }
      if (!(valor > 0)) { S.msg = 'Digite um valor maior que zero.'; renderSheet(); return; }
      const inicio = /^\d{4}-\d{2}$/.test(String(d.inicio || '')) ? d.inicio : S.mes;
      const row = {
        nome, dia, natureza: d.natureza, tipo: d.tipo, quem: d.quem, recorrencia: d.recorrencia, inicio,
        parcelas: d.recorrencia === 'parcelado' ? Math.max(1, parseInt(fd.get('parcelas'), 10) || 2) : null
      };
      if (!d.id) ins('contas', { ...row, valor, fim: null });
      else {
        const p = S.data.pagamentos.find((x) => x.conta_id === d.id && x.mes === S.mes);
        const mudou = Math.abs(valor - Number(d.valor0 ?? d.valor)) > 0.004;
        const soMes = mudou && S.v4 && d.recorrencia !== 'unica' && d.escopo === 'mes';
        if (mudou && !soMes) row.valor = valor;
        upd('contas', d.id, row);
        if (soMes) {
          if (p) upd('pagamentos', p.id, { valor, ajustado: true });
          else ins('pagamentos', { conta_id: d.id, mes: S.mes, valor, pago: false, ajustado: true });
        } else if (mudou && p) {
          if (p.ajustado && p.pago === false) del('pagamentos', p.id);
          else upd('pagamentos', p.id, { valor, ajustado: false });
        }
      }
      const fora = inicio > S.mes;
      closeSheet(); render();
      toast(fora ? `${d.id ? 'Conta atualizada' : 'Conta lançada'}: aparece a partir de ${monthLabel(inicio).toLowerCase()}.` : (d.id ? 'Conta atualizada.' : 'Conta lançada.'));
    },
    async aporte(fd) {
      const valor = parseMoney(fd.get('valor'));
      if (!(valor > 0)) { toast('Digite o valor do aporte.'); return; }
      ins('aportes', { aplicacao_id: fd.get('aplicacao_id'), data: fd.get('data') || todayISO(), valor });
      closeSheet(); render(); toast('Aporte registrado.');
      loadCDI().then(safeRender);
    },
    async desejo(fd) {
      syncDraft();
      const d = S.sheet.draft;
      const nome = String(fd.get('nome') || '').trim();
      if (!nome) { S.msg = 'Escreva o que vocês querem comprar.'; renderSheet(); return; }
      const link = String(fd.get('link') || '').trim();
      if (link && !linkSeguro(link)) { S.msg = 'O link precisa começar com https://'; renderSheet(); return; }
      const row = { nome, valor: parseMoney(fd.get('valor')), prioridade: d.prioridade || 'media', quem: d.quem || 'Casa', link };
      if (d.id) upd('desejos', d.id, row);
      else { row.ordem = (Math.max(0, ...S.data.desejos.map((x) => Number(x.ordem) || 0)) + 1); row.comprado = false; ins('desejos', row); }
      closeSheet(); render(); toast(d.id ? 'Desejo atualizado.' : 'Desejo adicionado.');
    },
    async aplicacao(fd) {
      const d = S.sheet.draft;
      const row = { nome: String(fd.get('nome')).trim(), instituicao: String(fd.get('instituicao') || '').trim(), pct_cdi: parseMoney(fd.get('pct_cdi')) || 100 };
      const saldoTxt = String(fd.get('saldo') || '').trim();
      if (!d.id || saldoTxt) Object.assign(row, { saldo_base: parseMoney(saldoTxt), data_base: todayISO(), base_atualizada_em: new Date().toISOString() });
      if (d.id) upd('aplicacoes', d.id, row); else ins('aplicacoes', row);
      closeSheet(); render(); toast('Aplicação salva.');
    },
    async 'item-novo'(fd, form) {
      const nome = String(fd.get('nome') || '').trim(); if (!nome) return;
      const igual = S.data.mercado_itens.find((x) => norm(x.nome) === norm(nome));
      if (igual) { toast(`${igual.nome} já está em "${igual.ativo ? 'Comprar' : 'Em casa'}".`); return; }
      const cat = categoriaSugerida(nome);
      const naLista = S.abaMercado !== 'casa';
      ins('mercado_itens', { nome, valor: parseMoney(fd.get('valor')), ativo: naLista, categoria: cat, quantidade: 1, volta_em: null });
      form.reset(); render();
      const f = $('#novo-item'); if (f) f.focus();
      toast(naLista ? `${nome} entrou em ${cat}. Lista: ${brl(mercadoTotais().total)}` : `${nome} guardado em "Em casa".`);
    },
    async item(fd) {
      syncDraft();
      const d = S.sheet.draft;
      const nome = String(fd.get('nome') || '').trim();
      if (!nome) { S.msg = 'Escreva o nome do item.'; renderSheet(); return; }
      const naLista = d.onde !== 'casa';
      const patch = { nome, valor: parseMoney(fd.get('valor')), ativo: naLista, categoria: CATS.includes(d.categoria) ? d.categoria : categoriaSugerida(nome), quantidade: Math.max(1, parseInt(fd.get('quantidade'), 10) || 1) };
      if (naLista) patch.volta_em = null;
      upd('mercado_itens', d.id, patch);
      closeSheet(); render(); toast('Item atualizado.');
    },
    async 'excluir-usuario'(fd) {
      if (String(fd.get('confirmacao') || '').trim().toUpperCase() !== 'EXCLUIR') { toast('Digite EXCLUIR para confirmar.'); return; }
      S.confirmExcluir = false;
      await API.excluirConta();
      S.phase = 'auth'; S.authView = 'login'; S.familia = null; S.membro = null;
      TABLES.forEach((t) => { S.data[t] = []; });
      render(); toast('Sua conta foi excluída.');
    },
    async 'ajustes-familia'(fd) {
      const patch = {
        sobrenome: String(fd.get('sobrenome')).trim() || S.familia.sobrenome,
        limite_mercado: parseMoney(fd.get('limite_mercado')),
        aporte_mensal: parseMoney(fd.get('aporte_mensal')),
        meta_reserva: parseMoney(fd.get('meta_reserva'))
      };
      Object.assign(S.familia, patch);
      const nome = String(fd.get('nome')).trim();
      await mut(() => API.updateFamilia(S.familia.id, patch));
      if (nome && nome !== S.membro.nome) {
        S.membro.nome = nome; const m = S.membros.find((x) => x.user_id === S.membro.user_id); if (m) m.nome = nome;
        await mut(() => API.updateMembro(S.membro.user_id, { nome }));
      }
      render(); toast('Ajustes salvos.');
    }
  };
  const ERROS = [
    [/invalid login/i, 'E-mail ou senha não conferem.'],
    [/email not confirmed/i, 'Confirme seu e-mail antes de entrar (veja a caixa de entrada e o spam).'],
    [/already registered|already been registered/i, 'Já existe uma conta com esse e-mail. Tente entrar.'],
    [/password should be/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/rate limit/i, 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'],
    [/failed to fetch|network/i, 'Sem conexão com a internet.']
  ];
  const traduzErro = (e) => { const m = String(e?.message || e || ''); for (const [re, t] of ERROS) if (re.test(m)) return t; return m || 'Algo deu errado. Tente de novo.'; };
  document.addEventListener('submit', async (ev) => {
    const form = ev.target; const name = form.dataset.form; if (!forms[name]) return;
    ev.preventDefault();
    const btn = form.querySelector('[type=submit]'); if (btn) btn.disabled = true;
    try { S.msg = ''; await forms[name](new FormData(form), form); }
    catch (e) { console.error(e); S.msg = traduzErro(e); if (S.sheet) renderSheet(); else render(); }
    finally { if (btn && btn.isConnected) btn.disabled = false; }
  });

  // ---------------------------------------------------------------- navegação
  function route() {
    const v = location.hash.replace('#', '');
    S.view = VIEWS.includes(v) ? v : 'painel';
    S.confirmExcluir = false;
    if (S.sheet) closeSheet();
    if (S.phase === 'app') { render(); window.scrollTo(0, 0); }
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.installEvt = e; if (S.view === 'ajustes') safeRender(); });

  // ---------------------------------------------------------------- início
  let subscribed = false;
  async function boot() {
    S.msg = '';
    const session = await API.session();
    if (!session) { S.phase = 'auth'; render(); return; }
    await loadAll();
    if (S.phase === 'app') {
      const v = location.hash.replace('#', ''); S.view = VIEWS.includes(v) ? v : 'painel';
      // Abre no mês mais antigo que ainda tem conta sem pagar; senão, no mês atual
      const pend = mesComPendencia();
      if (pend) S.mes = pend;
      else if (!contasDoMes(S.mes).length) {
        const futuros = S.data.contas.map((c) => c.inicio).filter((m) => m > S.mes).sort();
        if (futuros.length) S.mes = futuros[0];
      }
      if (!subscribed) { API.subscribe(() => scheduleReload()); subscribed = true; }
      loadCDI().then(() => { if (S.view === 'reserva' || S.view === 'painel') safeRender(); });
      setTimeout(avisarVencimentos, 1500);
    }
    render();
  }
  API.onAuth((ev) => {
    if (ev === 'PASSWORD_RECOVERY') { S.phase = 'recovery'; render(); }
    if (ev === 'SIGNED_OUT') { S.phase = 'auth'; render(); }
  });
  // Versão nova publicada? Recarrega a página (sem atrapalhar quem está preenchendo algo)
  let versaoAtual = null; let precisaRecarregar = false;
  async function checarVersao() {
    try {
      const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return;
      const v = (await r.json()).versao;
      if (!versaoAtual) { versaoAtual = v; return; }
      if (v && v !== versaoAtual) precisaRecarregar = true;
    } catch { /* sem internet */ }
    if (precisaRecarregar && !S.sheet && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) location.reload();
  }
  checarVersao();
  setInterval(checarVersao, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    checarVersao();
    if (S.phase === 'app') scheduleReload();
  });

  aplicarTema();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot().catch((e) => {
    console.error(e);
    $('#app').innerHTML = `<div class="auth"><div class="auth-box"><h1>Não consegui abrir</h1><p class="muted">${h(traduzErro(e))}</p><button class="btn primary" onclick="location.reload()">Tentar de novo</button></div></div>`;
  });
})();
