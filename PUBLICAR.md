# Publicar a sua Ca$a

Tudo gratuito. Leva uns 20 minutos.

## 1. Banco de dados (Supabase)

1. Crie uma conta em **supabase.com** › **New organization** (Personal, Free) › **New project**.
   - Região: **South America (São Paulo)** · Senha do banco: gere e guarde.
2. Menu **SQL Editor** › **New query** › cole todo o `supabase/schema.sql` › **Run**. Deve aparecer "Success".
3. Menu **Authentication** › **Sign In / Providers** › desligue **Confirm email** e salve (opcional, mas deixa o cadastro mais simples).
4. Menu **Project Settings**:
   - **Data API** › copie o **Project URL** (só até `.supabase.co`, sem `/rest/v1`).
   - **API Keys** › copie a **Publishable key** (`sb_publishable_...`).
   - **Nunca** use a **Secret key** (`sb_secret_...`) no app.

## 2. Site (Netlify)

### Opção A: ligado ao GitHub (atualiza sozinho)
1. Faça um fork deste repositório (ou suba os arquivos no seu GitHub).
2. Em **app.netlify.com** › **Add new project** › **Import an existing project** › **GitHub** › escolha o repositório.
3. Deixe as configurações de build como vieram (o `netlify.toml` cuida disso) e, em **Environment variables**, cadastre:
   - `SUPABASE_URL` = o Project URL
   - `SUPABASE_ANON_KEY` = a Publishable key
   - `CONTATO` = um e-mail para pedidos sobre dados (aparece na página de privacidade)
4. **Deploy**. Toda mudança no GitHub publica o site de novo.

### Opção B: arrastar a pasta
1. Preencha os valores direto em `js/config.js` (Bloco de Notas serve).
2. Abra **app.netlify.com/drop** e arraste a pasta inteira. Para atualizar depois: site › **Deploys** › arraste de novo.

### Depois de publicar
- **Site configuration** › **Change site name** para um nome melhor. O `$` não é aceito em endereços de site; use algo como `app-casa`.
- Confirme que o site está **público** (botão **Make public**, se aparecer).
- No Supabase › **Authentication** › **URL Configuration** › **Site URL**: cole o endereço do site (necessário para o "Esqueci a senha").

## 3. Primeiro acesso

1. Abra o endereço › **Criar conta** › **Criar família** com o seu sobrenome.
2. Em **Ajustes** está o **código de convite**: mande para quem mora com você. A pessoa cria a conta e escolhe **Tenho um código**.
3. Para lançar muitas contas de uma vez por SQL, use `supabase/exemplo-contas-iniciais.sql` como modelo (troque o sobrenome e as contas).

## 4. Instalar no celular

- **Android (Chrome ou Firefox):** menu ⋮ › **Instalar app** ou **Adicionar à tela inicial**.
- **iPhone (Safari):** Compartilhar › **Adicionar à Tela de Início**.

## Atualizações do banco

Se você instalou antes de 08/11/2026, rode também `supabase/atualizacao-2-exclusao-segura.sql` no SQL Editor (ativa o botão "Excluir minha conta").
