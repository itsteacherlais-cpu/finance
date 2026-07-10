import type { ReservaRecorrente, Transacao } from '../types'
import { valorAGuardarPorMes } from './deteccaoRecorrencia'

export interface Previsao {
  gastoNormalMedio: number
  somaReservas: number
  previsaoTotal: number
}

/**
 * Estima quanto a usuária provavelmente vai gastar no próximo mês:
 * a média do que ela gasta "no dia a dia" (excluindo categorias que já têm
 * uma reserva inteligente, para não contar duas vezes) + o quanto precisa
 * separar por mês para as despesas recorrentes já confirmadas.
 */
export function calcularPrevisao(
  transacoes: Transacao[],
  reservasRecorrentes: ReservaRecorrente[],
  mesesDeHistorico = 3,
): Previsao {
  const categoriasComReserva = new Set(reservasRecorrentes.map((r) => r.categoria_id).filter((id): id is string => !!id))

  const hoje = new Date()
  let somaGastoNormal = 0
  let mesesComDados = 0

  for (let i = 1; i <= mesesDeHistorico; i++) {
    const referencia = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesChave = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, '0')}`

    const gastosDoMes = transacoes.filter(
      (t) => t.tipo === 'saida' && t.data.startsWith(mesChave) && !(t.categoria_id && categoriasComReserva.has(t.categoria_id)),
    )
    if (gastosDoMes.length === 0) continue

    somaGastoNormal += gastosDoMes.reduce((s, t) => s + t.valor, 0)
    mesesComDados++
  }

  const gastoNormalMedio = mesesComDados > 0 ? somaGastoNormal / mesesComDados : 0
  const somaReservas = reservasRecorrentes.reduce((s, r) => s + valorAGuardarPorMes(r.valor_medio, r.intervalo_em_meses), 0)

  return {
    gastoNormalMedio: Math.round(gastoNormalMedio * 100) / 100,
    somaReservas: Math.round(somaReservas * 100) / 100,
    previsaoTotal: Math.round((gastoNormalMedio + somaReservas) * 100) / 100,
  }
}
