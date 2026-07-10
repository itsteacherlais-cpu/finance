import type { Categoria, Transacao } from '../types'
import { corDeReserva } from './paletaCategorias'

export interface FatiaCategoria {
  categoriaId: string
  nome: string
  valor: number
  cor: string
}

/** Soma o total gasto (ou recebido) por categoria, para o gráfico de rosca. */
export function agruparPorCategoria(transacoes: Transacao[], categorias: Categoria[]): FatiaCategoria[] {
  const somaPorId = new Map<string, number>()
  for (const t of transacoes) {
    const chave = t.categoria_id ?? 'sem-categoria'
    somaPorId.set(chave, (somaPorId.get(chave) ?? 0) + t.valor)
  }

  return [...somaPorId.entries()]
    .map(([id, valor], indice) => {
      const categoria = categorias.find((c) => c.id === id)
      return {
        categoriaId: id,
        nome: categoria?.nome ?? 'Sem categoria',
        valor,
        cor: categoria?.cor || corDeReserva(indice),
      }
    })
    .sort((a, b) => b.valor - a.valor)
}

export interface PontoMensal {
  mesChave: string // "2026-07"
  rotulo: string // "jul/26"
  entrada: number
  saida: number
}

const NOMES_MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Agrupa entradas e saídas por mês, preenchendo meses sem lançamento com zero. */
export function agruparPorMes(transacoes: Transacao[], quantidadeMeses: number): PontoMensal[] {
  const hoje = new Date()
  const meses: PontoMensal[] = []

  for (let i = quantidadeMeses - 1; i >= 0; i--) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesChave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    meses.push({
      mesChave,
      rotulo: `${NOMES_MESES[data.getMonth()]}/${String(data.getFullYear()).slice(2)}`,
      entrada: 0,
      saida: 0,
    })
  }

  const indicePorMes = new Map(meses.map((m, i) => [m.mesChave, i]))

  for (const t of transacoes) {
    const mesChave = t.data.slice(0, 7)
    const indice = indicePorMes.get(mesChave)
    if (indice === undefined) continue
    if (t.tipo === 'entrada') meses[indice].entrada += t.valor
    else meses[indice].saida += t.valor
  }

  return meses
}

export interface PontoSaldo {
  mesChave: string
  rotulo: string
  saldo: number
}

/** Saldo acumulado mês a mês (soma de todas as entradas menos saídas até aquele mês). */
export function calcularSaldoAcumulado(pontosMensais: PontoMensal[]): PontoSaldo[] {
  let acumulado = 0
  return pontosMensais.map((p) => {
    acumulado += p.entrada - p.saida
    return { mesChave: p.mesChave, rotulo: p.rotulo, saldo: acumulado }
  })
}
