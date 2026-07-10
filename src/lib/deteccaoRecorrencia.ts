import type { Categoria, Frequencia, ReservaRecorrente, Transacao } from '../types'

// ============================================================================
// Detecção de despesas recorrentes.
//
// Ideia geral: agrupamos as saídas por categoria (ou, se não tiver categoria,
// pela descrição) e olhamos o intervalo, em dias, entre uma ocorrência e a
// próxima. Se esse intervalo se repete de forma parecida (não varia demais),
// consideramos que é um padrão recorrente e sugerimos guardar dinheiro por
// mês para ele. Isso roda toda vez que a tela é aberta — nada fica "adivinhado"
// de forma permanente até a usuária confirmar a sugestão.
// ============================================================================

export interface CandidatoRecorrencia {
  chave: string
  nome: string
  categoriaId: string | null
  frequencia: Frequencia
  intervaloEmMeses: number
  valorMedio: number
  ultimaOcorrencia: string
  proximaOcorrencia: string
  quantidadeOcorrencias: number
  confiabilidade: 'alta' | 'media' | 'baixa'
}

const UM_DIA_MS = 1000 * 60 * 60 * 24

function diasEntre(dataA: string, dataB: string): number {
  return Math.round((new Date(dataB).getTime() - new Date(dataA).getTime()) / UM_DIA_MS)
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase()
}

function somarDias(dataIso: string, dias: number): string {
  const data = new Date(dataIso)
  data.setDate(data.getDate() + Math.round(dias))
  return data.toISOString().slice(0, 10)
}

/**
 * Classifica um intervalo médio (em dias) em uma frequência conhecida.
 * Se não bater com nenhuma janela usual, cai em "personalizada".
 */
function classificarFrequencia(mediaDias: number): { frequencia: Frequencia; intervaloEmMeses: number } {
  if (mediaDias >= 10 && mediaDias <= 20) return { frequencia: 'quinzenal', intervaloEmMeses: 0.5 }
  if (mediaDias >= 24 && mediaDias <= 36) return { frequencia: 'mensal', intervaloEmMeses: 1 }
  if (mediaDias >= 75 && mediaDias <= 105) return { frequencia: 'trimestral', intervaloEmMeses: 3 }
  if (mediaDias >= 160 && mediaDias <= 200) return { frequencia: 'semestral', intervaloEmMeses: 6 }
  if (mediaDias >= 330 && mediaDias <= 400) return { frequencia: 'anual', intervaloEmMeses: 12 }
  return { frequencia: 'personalizada', intervaloEmMeses: Math.max(0.25, Math.round((mediaDias / 30) * 10) / 10) }
}

function media(numeros: number[]): number {
  return numeros.reduce((s, n) => s + n, 0) / numeros.length
}

function desvioPadrao(numeros: number[], mediaValor: number): number {
  if (numeros.length <= 1) return 0
  const variancia = media(numeros.map((n) => (n - mediaValor) ** 2))
  return Math.sqrt(variancia)
}

const VARIACAO_MAXIMA_ACEITA = 0.35 // 35% — acima disso, o intervalo é irregular demais para confiar

/**
 * Analisa o histórico de saídas e devolve sugestões de despesas recorrentes
 * que ainda não estão confirmadas na lista de "Reservas Inteligentes".
 */
export function detectarCandidatos(
  transacoes: Transacao[],
  categorias: Categoria[],
  reservasExistentes: ReservaRecorrente[],
): CandidatoRecorrencia[] {
  const categoriasComReserva = new Set(reservasExistentes.map((r) => r.categoria_id).filter((id): id is string => !!id))

  const grupos = new Map<string, Transacao[]>()
  for (const t of transacoes) {
    if (t.tipo !== 'saida') continue
    const chave = t.categoria_id ? `cat:${t.categoria_id}` : t.descricao ? `desc:${normalizar(t.descricao)}` : null
    if (!chave) continue
    if (t.categoria_id && categoriasComReserva.has(t.categoria_id)) continue
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave)!.push(t)
  }

  const candidatos: CandidatoRecorrencia[] = []

  for (const [chave, itens] of grupos) {
    if (itens.length < 2) continue

    const ordenados = [...itens].sort((a, b) => (a.data < b.data ? -1 : 1))
    const deltas: number[] = []
    for (let i = 1; i < ordenados.length; i++) {
      deltas.push(diasEntre(ordenados[i - 1].data, ordenados[i].data))
    }

    const mediaDias = media(deltas)
    if (mediaDias < 10) continue // muito frequente para ser uma "reserva" (ex: gasto quase diário)

    const cv = mediaDias > 0 ? desvioPadrao(deltas, mediaDias) / mediaDias : 0
    if (cv > VARIACAO_MAXIMA_ACEITA) continue

    const { frequencia, intervaloEmMeses } = classificarFrequencia(mediaDias)
    const categoria = ordenados[0].categoria_id ? categorias.find((c) => c.id === ordenados[0].categoria_id) : undefined
    const ultimaOcorrencia = ordenados[ordenados.length - 1].data

    candidatos.push({
      chave,
      nome: categoria?.nome ?? ordenados[0].descricao ?? 'Despesa recorrente',
      categoriaId: ordenados[0].categoria_id,
      frequencia,
      intervaloEmMeses,
      valorMedio: Math.round(media(ordenados.map((t) => t.valor)) * 100) / 100,
      ultimaOcorrencia,
      proximaOcorrencia: somarDias(ultimaOcorrencia, mediaDias),
      quantidadeOcorrencias: ordenados.length,
      confiabilidade: ordenados.length >= 4 ? 'alta' : ordenados.length === 3 ? 'media' : 'baixa',
    })
  }

  return candidatos.sort((a, b) => b.valorMedio / b.intervaloEmMeses - a.valorMedio / a.intervaloEmMeses)
}

/** Valor sugerido para guardar por mês, dada uma reserva (confirmada ou candidata). */
export function valorAGuardarPorMes(valorMedio: number, intervaloEmMeses: number): number {
  return valorMedio / intervaloEmMeses
}

/**
 * Quanto a usuária "já teria guardado" no ciclo atual, considerando que ela
 * começou a guardar o valor sugerido por mês desde a última ocorrência
 * conhecida dessa despesa. Nunca passa do valor total da despesa.
 */
export function quantoJaGuardado(ultimaOcorrencia: string | null, valorMedio: number, intervaloEmMeses: number): number {
  if (!ultimaOcorrencia) return 0
  const diasDesde = diasEntre(ultimaOcorrencia, new Date().toISOString().slice(0, 10))
  const mesesDesde = Math.max(0, diasDesde / 30)
  const guardado = mesesDesde * valorAGuardarPorMes(valorMedio, intervaloEmMeses)
  return Math.min(guardado, valorMedio)
}

const DIAS_POR_MES = 30.44

/** Estima a última ocorrência de uma reserva confirmada a partir da próxima data prevista. */
export function ultimaOcorrenciaEstimada(proximaOcorrencia: string | null, intervaloEmMeses: number): string | null {
  if (!proximaOcorrencia) return null
  return somarDias(proximaOcorrencia, -intervaloEmMeses * DIAS_POR_MES)
}

/** Empurra a data prevista para frente até cair no futuro (para exibição). */
export function proximaOcorrenciaAtualizada(proximaOcorrencia: string | null, intervaloEmMeses: number): string | null {
  if (!proximaOcorrencia) return null
  const hojeIso = new Date().toISOString().slice(0, 10)
  let proxima = proximaOcorrencia
  let protecao = 0
  while (proxima < hojeIso && protecao < 1000) {
    proxima = somarDias(proxima, intervaloEmMeses * DIAS_POR_MES)
    protecao++
  }
  return proxima
}
