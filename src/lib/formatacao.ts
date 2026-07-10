// Funções pequenas de formatação usadas em várias telas do app.

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarDataCurta(dataIso: string): string {
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function hojeISO(): string {
  const agora = new Date()
  const offset = agora.getTimezoneOffset()
  const local = new Date(agora.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}
