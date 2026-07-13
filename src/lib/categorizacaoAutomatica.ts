import type { Transacao } from '../types'

// ============================================================================
// Sugestão automática de categoria para lançamentos importados.
//
// Ideia: aprender com o que a própria usuária já categorizou antes (manual
// ou de uma importação anterior já corrigida). Para cada transação com
// categoria, guardamos quais "palavras-chave" da descrição apontam para
// aquela categoria. Uma descrição nova recebe a categoria que mais bateu
// palavras-chave no histórico. Sem histórico compatível, fica sem sugestão
// (null) — a usuária escolhe na hora de revisar.
// ============================================================================

const PALAVRA_MINIMA = 3
const CODIGO_MARCA_ACENTO_INICIO = 0x0300 // faixa Unicode dos acentos "soltos" depois do normalize('NFD')
const CODIGO_MARCA_ACENTO_FIM = 0x036f

function normalizar(texto: string): string {
  const semAcentos = texto
    .toLowerCase()
    .normalize('NFD')
    .split('')
    .filter((c) => {
      const codigo = c.codePointAt(0) ?? 0
      return codigo < CODIGO_MARCA_ACENTO_INICIO || codigo > CODIGO_MARCA_ACENTO_FIM
    })
    .join('')
  return semAcentos.replace(/[^a-z0-9\s]/g, ' ')
}

function extrairPalavrasChave(descricao: string): string[] {
  return normalizar(descricao)
    .split(/\s+/)
    .filter((p) => p.length >= PALAVRA_MINIMA && !/^\d+$/.test(p)) // ignora números soltos (datas, parcelas)
}

export interface IndiceCategorizacao {
  votosPorPalavra: Map<string, Map<string, number>>
}

/** Monta o índice palavra-chave → categoria a partir do histórico já categorizado. */
export function construirIndiceCategorizacao(transacoes: Transacao[]): IndiceCategorizacao {
  const votosPorPalavra = new Map<string, Map<string, number>>()

  for (const t of transacoes) {
    if (!t.categoria_id || !t.descricao) continue
    for (const palavra of extrairPalavrasChave(t.descricao)) {
      if (!votosPorPalavra.has(palavra)) votosPorPalavra.set(palavra, new Map())
      const votos = votosPorPalavra.get(palavra)!
      votos.set(t.categoria_id, (votos.get(t.categoria_id) ?? 0) + 1)
    }
  }

  return { votosPorPalavra }
}

/** Sugere uma categoria para a descrição informada, ou null se não achar nada parecido. */
export function sugerirCategoria(indice: IndiceCategorizacao, descricao: string): string | null {
  const pontosPorCategoria = new Map<string, number>()

  for (const palavra of extrairPalavrasChave(descricao)) {
    const votos = indice.votosPorPalavra.get(palavra)
    if (!votos) continue
    for (const [categoriaId, quantidade] of votos) {
      pontosPorCategoria.set(categoriaId, (pontosPorCategoria.get(categoriaId) ?? 0) + quantidade)
    }
  }

  let melhorCategoria: string | null = null
  let melhorPontuacao = 0
  for (const [categoriaId, pontuacao] of pontosPorCategoria) {
    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao
      melhorCategoria = categoriaId
    }
  }

  return melhorCategoria
}
