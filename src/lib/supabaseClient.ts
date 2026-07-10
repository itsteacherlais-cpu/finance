import { createClient } from '@supabase/supabase-js'

// As duas variáveis abaixo vêm do arquivo .env (veja .env.example).
// Elas identificam QUAL projeto Supabase o app usa — não são segredos
// sensíveis (a URL e a chave "anon" são seguras para expor no navegador,
// pois a segurança de verdade é feita pelas regras RLS no banco de dados).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase não encontrada. Copie o arquivo .env.example para .env ' +
      'e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY com os dados do seu projeto ' +
      '(veja o README para o passo a passo).',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
