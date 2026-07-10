# Meu Financeiro

App pessoal de controle financeiro — PWA (funciona no navegador e pode ser
"instalado" na tela inicial do iPhone), com os dados sincronizados na nuvem
entre celular e computador.

Este README explica, passo a passo e sem pressupor conhecimento técnico,
como colocar o app no ar. São duas partes: **1)** criar o banco de dados
(Supabase) e **2)** publicar o site (Vercel).

---

## 1. Criar o banco de dados no Supabase

O Supabase é onde ficam guardados seus lançamentos, categorias e formas de
pagamento — com sincronização automática entre os dispositivos.

1. Acesse **[supabase.com](https://supabase.com)** e crie uma conta gratuita
   (pode entrar com sua conta do Google/GitHub).
2. Clique em **"New Project"**.
   - Dê um nome, por exemplo `meu-financeiro`.
   - Crie uma senha para o banco de dados e **guarde-a em um lugar seguro**
     (você provavelmente não vai precisar dela de novo, mas é bom ter).
   - Escolha a região mais próxima de você (ex: "South America (São Paulo)").
   - Clique em **"Create new project"** e aguarde alguns minutos.
3. Quando o projeto terminar de ser criado, no menu à esquerda clique em
   **"SQL Editor"** e depois em **"New query"**.
4. Abra o arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste
   projeto, copie **todo o conteúdo** e cole na caixa de texto do SQL
   Editor.
5. Clique em **"Run"** (ou aperte Ctrl/Cmd + Enter). Isso cria todas as
   tabelas e regras de segurança necessárias.
   - É seguro rodar esse script mais de uma vez, caso precise.
6. No menu à esquerda, vá em **"Authentication" > "Providers"** e confirme
   que **"Email"** está habilitado (já vem habilitado por padrão).
   - Dica: em **"Authentication" > "Settings"**, se quiser pular a etapa de
     confirmação por e-mail ao criar a conta (mais prático para uso
     pessoal), desative a opção "Confirm email".
7. Agora vá em **"Project Settings" > "API"**. Você vai precisar de dois
   valores nessa página:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa de letras e números)

   Guarde essa aba aberta — você vai usar esses dois valores no próximo
   passo e também na hora de publicar o site.

---

## 2. Rodar o app no seu computador (opcional, para testar antes de publicar)

Pré-requisito: ter o [Node.js](https://nodejs.org) instalado (versão 20 ou
mais recente).

1. Nesta pasta do projeto, copie o arquivo `.env.example` e renomeie a
   cópia para `.env`.
2. Abra o arquivo `.env` e preencha com os valores que você pegou no passo
   anterior:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
3. No terminal, dentro desta pasta, rode:
   ```
   npm install
   npm run dev
   ```
4. Abra o endereço que aparecer no terminal (geralmente
   `http://localhost:5173`) no navegador.
5. Crie sua conta (e-mail e senha) na tela inicial — essa é a conta que
   você vai usar também pelo celular.

---

## 3. Publicar o site (Vercel)

A Vercel hospeda o site gratuitamente e dá um endereço público (algo como
`meu-financeiro.vercel.app`) que você pode acessar de qualquer lugar.

1. Suba este projeto para um repositório no **GitHub** (se ainda não
   estiver lá).
2. Acesse **[vercel.com](https://vercel.com)** e crie uma conta (dá para
   entrar direto com o GitHub).
3. Clique em **"Add New..." > "Project"** e selecione o repositório deste
   app.
4. Na tela de configuração do projeto, abra a seção **"Environment
   Variables"** e adicione as duas variáveis do Supabase:
   - `VITE_SUPABASE_URL` → cole o Project URL
   - `VITE_SUPABASE_ANON_KEY` → cole a anon public key
5. Clique em **"Deploy"** e aguarde. Em cerca de um minuto o site estará no
   ar, com um link público.
6. Sempre que você (ou o Claude Code) enviar mudanças para o repositório no
   GitHub, a Vercel publica a nova versão automaticamente.

---

## 4. Instalar no iPhone (tela de início)

1. No iPhone, abra o link do site publicado (passo anterior) no **Safari**
   (precisa ser o Safari, não funciona pelo Chrome no iPhone).
2. Toque no ícone de compartilhar (o quadrado com uma seta para cima).
3. Escolha **"Adicionar à Tela de Início"**.
4. Pronto — um ícone do app aparece na tela inicial, e ele abre em tela
   cheia, como um aplicativo normal.

No computador, basta acessar o mesmo link pelo navegador. Como os dois
usam a mesma conta e o mesmo banco de dados no Supabase, os lançamentos
aparecem sincronizados nos dois lugares.

---

## Como o projeto é organizado

```
src/
  pages/         Uma tela do app por arquivo (Dashboard, NovoLancamento, ...)
  components/    Pedaços de tela reutilizados (barra de navegação, ícones, ...)
  context/       Onde os dados da usuária ficam guardados em memória
                 (AuthContext = login, DataContext = transações/categorias/formas)
  lib/           Funções auxiliares (formatação de moeda/data, cálculos dos gráficos)
  types/         Formato dos dados (deve espelhar as tabelas do banco)
supabase/
  schema.sql     Script que cria as tabelas no Supabase
```

### Coisas que você consegue ajustar sozinha, sem programar

- **Categorias e formas de pagamento**: tela "Ajustes" dentro do app —
  adicione, edite ou remova livremente.
- **Cores do app**: arquivo `src/index.css`, dentro do bloco `@theme` — lá
  estão nomeadas as cores (`--color-oliva-600`, `--color-terracota-500`,
  etc.) usadas em todo o app.
- **Categorias sugeridas para novas contas**: arquivo `supabase/schema.sql`,
  dentro da função `criar_dados_iniciais` — é a lista que aparece pronta
  quando alguém cria uma conta nova.

### O que ainda falta (próximas fases do projeto)

Este é o MVP (Fase 1): lançamentos, categorias/formas de pagamento
editáveis e o painel com os 3 gráficos principais.

A Fase 2 (ainda não implementada) é a parte de "inteligência": detectar
sozinho quais gastos são recorrentes (anuais, mensais, quinzenais) e
sugerir quanto guardar por mês para cada um deles, na tela "Reservas
Inteligentes". A tabela `reservas_recorrentes` já existe no banco de dados,
pronta para quando essa fase for construída.

---

## Stack técnica

- **React + TypeScript + Vite**, estilizado com **Tailwind CSS**
- **PWA** (instalável, funciona offline para o que já foi carregado) via
  `vite-plugin-pwa`
- **Supabase** (Postgres + autenticação) como backend
- **Recharts** para os gráficos
