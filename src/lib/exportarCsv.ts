import type { Categoria, FormaPagamento, Transacao } from '../types'
import { formatarDataCurta } from './formatacao'

function campoCsv(valor: string): string {
  if (/[;"\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}

/**
 * Gera um arquivo .csv com os lançamentos passados e dispara o download no
 * navegador. Usamos ";" como separador (padrão do Excel em português) e um
 * BOM no início para acentos aparecerem certos ao abrir no Excel.
 */
export function exportarTransacoesCsv(
  transacoes: Transacao[],
  categorias: Categoria[],
  formasPagamento: FormaPagamento[],
  nomeArquivo: string,
) {
  const nomeCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? ''
  const nomeForma = (id: string | null) => formasPagamento.find((f) => f.id === id)?.nome ?? ''

  const cabecalho = ['Data', 'Tipo', 'Categoria', 'Forma de pagamento', 'Descrição', 'Valor']
  const linhas = transacoes.map((t) =>
    [
      formatarDataCurta(t.data),
      t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      nomeCategoria(t.categoria_id),
      nomeForma(t.forma_pagamento_id),
      t.descricao ?? '',
      t.valor.toFixed(2).replace('.', ','),
    ]
      .map(campoCsv)
      .join(';'),
  )

  const conteudo = '﻿' + [cabecalho.join(';'), ...linhas].join('\r\n')
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
