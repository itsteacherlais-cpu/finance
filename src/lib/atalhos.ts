import type { Transacao } from '../types'

export interface AtalhoRapido {
  chave: string
  tipo: Transacao['tipo']
  categoria_id: string | null
  forma_pagamento_id: string | null
  rotulo: string
  vezesUsado: number
}

/**
 * Descobre os combos de (tipo + categoria + forma de pagamento) mais usados
 * no histórico de lançamentos, para virarem botões de "atalho rápido" na
 * tela de novo lançamento. Não precisa de configuração manual: quanto mais
 * a usuária lança, mais os atalhos se ajustam sozinhos ao uso real dela.
 */
export function calcularAtalhosRapidos(
  transacoes: Transacao[],
  nomeCategoria: (id: string | null) => string,
  nomeFormaPagamento: (id: string | null) => string,
  maximo = 6,
): AtalhoRapido[] {
  const contagem = new Map<string, AtalhoRapido>()

  for (const t of transacoes) {
    const chave = `${t.tipo}|${t.categoria_id ?? ''}|${t.forma_pagamento_id ?? ''}`
    const existente = contagem.get(chave)
    if (existente) {
      existente.vezesUsado += 1
    } else {
      contagem.set(chave, {
        chave,
        tipo: t.tipo,
        categoria_id: t.categoria_id,
        forma_pagamento_id: t.forma_pagamento_id,
        rotulo: `${nomeCategoria(t.categoria_id)} · ${nomeFormaPagamento(t.forma_pagamento_id)}`,
        vezesUsado: 1,
      })
    }
  }

  return [...contagem.values()]
    .filter((a) => a.vezesUsado >= 2)
    .sort((a, b) => b.vezesUsado - a.vezesUsado)
    .slice(0, maximo)
}
