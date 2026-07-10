// Tipos que espelham as tabelas do Supabase (veja supabase/schema.sql).
// Se você adicionar uma coluna nova no banco, adicione o campo aqui também.

export type TipoTransacao = 'entrada' | 'saida'
export type TipoCategoria = 'entrada' | 'saida' | 'ambos'
export type TipoFormaPagamento = 'dinheiro' | 'cartao' | 'pix' | 'outro'
export type Frequencia = 'mensal' | 'quinzenal' | 'trimestral' | 'semestral' | 'anual' | 'personalizada'

export interface Categoria {
  id: string
  user_id: string
  nome: string
  tipo: TipoCategoria
  cor: string
  icone: string | null
  criado_em: string
}

export interface FormaPagamento {
  id: string
  user_id: string
  nome: string
  tipo: TipoFormaPagamento
  criado_em: string
}

export interface Transacao {
  id: string
  user_id: string
  tipo: TipoTransacao
  valor: number
  data: string // formato "AAAA-MM-DD"
  categoria_id: string | null
  forma_pagamento_id: string | null
  descricao: string | null
  recorrente: boolean
  criado_em: string
}

export interface ReservaRecorrente {
  id: string
  user_id: string
  nome: string
  categoria_id: string | null
  frequencia: Frequencia
  intervalo_em_meses: number
  valor_medio: number
  confirmada: boolean
  proxima_ocorrencia: string | null
  criado_em: string
}

// Campos que a usuária preenche ao criar/editar — sem os campos
// gerados automaticamente pelo banco (id, user_id, criado_em).
export type NovaTransacao = Omit<Transacao, 'id' | 'user_id' | 'criado_em'>
export type NovaCategoria = Omit<Categoria, 'id' | 'user_id' | 'criado_em'>
export type NovaFormaPagamento = Omit<FormaPagamento, 'id' | 'user_id' | 'criado_em'>
