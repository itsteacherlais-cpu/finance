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
   - **Necessário:** em **"Authentication" > "Settings"**, desative a opção
     **"Confirm email"**. O app não pede e-mail/senha na tela — ele cria
     uma única conta interna sozinho na primeira vez que você digita o PIN
     (veja a seção 2 abaixo) — e sem desativar isso, essa conta ficaria
     esperando para sempre por uma confirmação que nunca chega.
7. Agora vá em **"Project Settings" > "API"**. Você vai precisar de dois
   valores nessa página:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - A chave pública do projeto — em projetos mais novos aparece como
     **"Publishable key"** (começa com `sb_publishable_...`); em projetos
     mais antigos aparece como **"anon" "public"** (uma sequência longa
     começando com `eyJ...`). É a mesma coisa, só mudou o nome. **Nunca**
     use a **"Secret key"** (`sb_secret_...`) ou a **"service_role"** —
     essas são secretas e não devem ir para o site.

   Guarde essa aba aberta — você vai usar esses dois valores no próximo
   passo e também na hora de publicar o site.

---

## 2. Rodar o app no seu computador (opcional, para testar antes de publicar)

Pré-requisito: ter o [Node.js](https://nodejs.org) instalado (versão 20 ou
mais recente).

1. Nesta pasta do projeto, copie o arquivo `.env.example` e renomeie a
   cópia para `.env`.
2. Abra o arquivo `.env` e preencha:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-publica-aqui

   VITE_APP_PIN=escolha-um-pin-seu
   VITE_APP_EMAIL=seu-email-aqui
   VITE_APP_PASSWORD=escolha-uma-senha-interna-qualquer
   ```
   As três últimas variáveis não são "sua conta" — é uma senha interna que
   só o app usa por trás dos panos para conversar com o Supabase. Você só
   precisa saber o **PIN** (`VITE_APP_PIN`) no dia a dia; escolha um fácil
   de digitar no celular. `VITE_APP_EMAIL` pode ser seu e-mail de verdade
   (não precisa confirmar, já que desativamos isso no passo anterior).
3. No terminal, dentro desta pasta, rode:
   ```
   npm install
   npm run dev
   ```
4. Abra o endereço que aparecer no terminal (geralmente
   `http://localhost:5173`) no navegador.
5. Digite o PIN que você escolheu — na primeira vez, o app cria a conta
   interna sozinho; nas próximas, ele já reconhece o PIN e entra direto.
   Esse mesmo PIN é o que você vai usar depois no celular também.

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
   Variables"** e adicione as cinco variáveis (as mesmas do arquivo `.env`
   que você preencheu no passo anterior — pode copiar os mesmos valores):
   - `VITE_SUPABASE_URL` → o Project URL
   - `VITE_SUPABASE_ANON_KEY` → a Publishable key (ou anon public key, no
     nome antigo)
   - `VITE_APP_PIN` → o PIN que você escolheu
   - `VITE_APP_EMAIL` → o e-mail que você escolheu
   - `VITE_APP_PASSWORD` → a senha interna que você escolheu
5. Clique em **"Deploy"** e aguarde. Em cerca de um minuto o site estará no
   ar, com um link público.
6. Sempre que você (ou o Claude Code) enviar mudanças para o repositório no
   GitHub, a Vercel publica a nova versão automaticamente.
7. **Se o site abrir em branco:** normalmente é porque essas variáveis não
   foram salvas antes do primeiro deploy. Adicione/confira elas em
   **Settings > Environment Variables** (marcando "Production") e depois
   force uma nova publicação em **Deployments > "..." > Redeploy** — só
   adicionar a variável não atualiza um site que já foi publicado.

### Sobre a tela de PIN

Em vez de "criar conta", o app pede só um PIN — mas é importante entender
o que isso protege e o que não protege:

- **Protege contra** alguém abrir o link por acaso e ver seus dados sem
  querer, ou uma pessoa próxima curiosa mexendo no seu celular/computador.
- **Não protege contra** alguém com conhecimento técnico que abra as
  ferramentas de desenvolvedor do navegador — o PIN e a senha interna
  ficam dentro do código do site, então são possíveis de encontrar por
  quem souber procurar. Isso é uma limitação de qualquer app que roda só
  no navegador, sem um servidor próprio por trás.
- Por causa disso, **não compartilhe o link do site publicamente** (redes
  sociais, grupos grandes, etc.) — trate-o como se fosse a senha do app.
- Se quiser trocar o PIN depois, é só mudar `VITE_APP_PIN` na Vercel
  (Settings > Environment Variables) e clicar em Redeploy.

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

### Como funciona a tela "Reservas Inteligentes" (Fase 2)

Toda vez que essa tela é aberta, o app olha o histórico de saídas e procura
despesas que se repetem em intervalos parecidos (ex: todo mês, a cada 3
meses, todo ano) — isso vira uma **sugestão automática**. Nada é salvo até
você tocar em "Confirmar"; se tocar em "Ignorar", aquela sugestão some (a
lista de ignoradas fica só no seu navegador, então pode reaparecer se você
usar outro aparelho).

Depois de confirmada — ou adicionada manualmente pelo botão "+ Adicionar
manualmente" (útil para uma despesa anual que você só tem 1 mês de
histórico) — a despesa vira uma **reserva confirmada**, e o app calcula:
- quanto guardar por mês (`valor médio ÷ intervalo em meses`);
- quanto você já "teria guardado" no ciclo atual, supondo que começou a
  guardar desde a última ocorrência conhecida.

A regra para o que conta como "regular" (e vira sugestão automática) está
em `src/lib/deteccaoRecorrencia.ts` — se um dia achar que ela está sugerindo
coisas erradas ou deixando passar despesas óbvias, é ali que se ajusta a
margem de tolerância.

A **previsão do próximo mês**, no topo dessa tela, soma a média do que você
gasta no dia a dia (excluindo categorias que já têm reserva confirmada,
para não contar duas vezes) com o total das reservas do mês.

### Refinamentos da Fase 3

- **Atalhos rápidos personalizáveis**: em Ajustes > "Atalhos rápidos", dá
  para montar seus próprios botões de 1 toque (nome, tipo, categoria, forma
  de pagamento e até um valor fixo — útil para uma assinatura que é sempre
  o mesmo valor). Dá para reordenar com as setas ou remover. Enquanto não
  tiver nenhum atalho manual cadastrado, o app continua sugerindo sozinho
  a partir do que você mais lança (o comportamento da Fase 1).
- **Filtros avançados no Painel**: além de período e forma de pagamento,
  agora dá para filtrar por categoria, e o gráfico de rosca tem um botão
  para alternar entre "Saídas" e "Entradas".
- **Exportação de relatórios**: na tela "Transações", os botões "Baixar
  CSV" (abre certinho no Excel/Google Planilhas) e "Imprimir / PDF" (abre o
  diálogo de impressão do navegador — no computador ou no iPhone, escolha
  "Salvar em PDF" em vez de uma impressora física) exportam exatamente os
  lançamentos filtrados na tela.

### O que ainda falta (fora de escopo por enquanto)

Fases 1, 2 e 3 do briefing original estão implementadas. A Fase 4 (expansão
para outras áreas da vida além de finanças) é uma visão de longo prazo e
não está no escopo deste app.

---

## Stack técnica

- **React + TypeScript + Vite**, estilizado com **Tailwind CSS**
- **PWA** (instalável, funciona offline para o que já foi carregado) via
  `vite-plugin-pwa`
- **Supabase** (Postgres + autenticação) como backend
- **Recharts** para os gráficos
