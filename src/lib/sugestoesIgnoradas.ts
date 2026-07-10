// Guarda, no próprio navegador, quais sugestões de recorrência a usuária já
// dispensou (para não ficar reaparecendo). Fica só localmente — se ela abrir
// o app em outro aparelho, a sugestão pode aparecer de novo lá, o que é uma
// limitação aceitável para o MVP.
const CHAVE = 'financeiro:sugestoes-ignoradas'

function lerTudo(): string[] {
  try {
    const bruto = localStorage.getItem(CHAVE)
    return bruto ? (JSON.parse(bruto) as string[]) : []
  } catch {
    return []
  }
}

export function estaIgnorada(chaveCandidato: string): boolean {
  return lerTudo().includes(chaveCandidato)
}

export function ignorarSugestao(chaveCandidato: string): void {
  const atuais = new Set(lerTudo())
  atuais.add(chaveCandidato)
  localStorage.setItem(CHAVE, JSON.stringify([...atuais]))
}
