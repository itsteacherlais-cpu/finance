// Ajuda a transformar opções como "Este mês" ou "Últimos 3 meses" em
// datas de início/fim concretas, usadas para filtrar transações.

export type OpcaoPeriodo = 'mes-atual' | 'ultimos-3-meses' | 'ultimos-6-meses' | 'ano-atual' | 'personalizado'

export interface IntervaloDatas {
  inicio: string // AAAA-MM-DD
  fim: string // AAAA-MM-DD
}

function paraISO(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function calcularIntervalo(opcao: OpcaoPeriodo, personalizado?: IntervaloDatas): IntervaloDatas {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth()

  switch (opcao) {
    case 'mes-atual':
      return {
        inicio: paraISO(new Date(anoAtual, mesAtual, 1)),
        fim: paraISO(new Date(anoAtual, mesAtual + 1, 0)),
      }
    case 'ultimos-3-meses':
      return {
        inicio: paraISO(new Date(anoAtual, mesAtual - 2, 1)),
        fim: paraISO(new Date(anoAtual, mesAtual + 1, 0)),
      }
    case 'ultimos-6-meses':
      return {
        inicio: paraISO(new Date(anoAtual, mesAtual - 5, 1)),
        fim: paraISO(new Date(anoAtual, mesAtual + 1, 0)),
      }
    case 'ano-atual':
      return {
        inicio: paraISO(new Date(anoAtual, 0, 1)),
        fim: paraISO(new Date(anoAtual, 11, 31)),
      }
    case 'personalizado':
      return personalizado ?? { inicio: paraISO(new Date(anoAtual, mesAtual, 1)), fim: paraISO(hoje) }
  }
}

export const RotulosPeriodo: Record<OpcaoPeriodo, string> = {
  'mes-atual': 'Este mês',
  'ultimos-3-meses': 'Últimos 3 meses',
  'ultimos-6-meses': 'Últimos 6 meses',
  'ano-atual': 'Este ano',
  personalizado: 'Personalizado',
}
