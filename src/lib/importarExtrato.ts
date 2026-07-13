// ============================================================================
// Importação de extrato/fatura em PDF.
//
// Extrai o texto do PDF (com pdfjs-dist, direto no navegador — nada é
// enviado para nenhum servidor) e tenta reconhecer, linha a linha, o padrão
// "data · descrição · valor" comum em extratos de banco e faturas de cartão.
//
// É uma leitura "melhor esforço": o layout de PDF varia muito de banco para
// banco, então linhas que não batem com o padrão são simplesmente ignoradas
// (e contadas, para avisar a usuária). Todo lançamento reconhecido continua
// editável depois, na tela de Transações.
// ============================================================================

export interface LinhaImportada {
  data: string // "AAAA-MM-DD"
  descricao: string
  valor: number // sempre positivo
  tipo: 'entrada' | 'saida'
  hash: string
}

export interface ResultadoImportacaoPdf {
  linhas: LinhaImportada[]
  linhasIgnoradas: number
}

// Ex: "01/07/2026", "01/07", "01/07/26" (só o primeiro "token" da linha)
const REGEX_DATA_INICIAL = /^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?$/

// Uma linha de extrato reconhecida tem: data no início, descrição no meio,
// e o valor no fim — ex: "01/07  UBER *TRIP  35,90" ou "01/07/2026 PIX RECEBIDO JOAO 1.200,00 C"
const REGEX_LINHA = /^(\d{2}\/\d{2}(?:\/\d{2,4})?)\s+(.+?)\s+(?:r\$\s?)?(\d{1,3}(?:\.\d{3})*,\d{2})\s*(-|d|c)?$/i

async function carregarPdfjs() {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url)
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString()
  return pdfjsLib
}

/** Extrai todo o texto de um PDF, uma linha de string por linha visual do documento. */
export async function extrairLinhasDoPdf(arquivo: File): Promise<string[]> {
  const pdfjsLib = await carregarPdfjs()
  const bytes = await arquivo.arrayBuffer()
  const documento = await pdfjsLib.getDocument({ data: bytes }).promise

  const linhas: string[] = []
  for (let numeroPagina = 1; numeroPagina <= documento.numPages; numeroPagina++) {
    const pagina = await documento.getPage(numeroPagina)
    const conteudo = await pagina.getTextContent()

    // Agrupamos os itens de texto por posição vertical (Y) aproximada, já
    // que o pdfjs devolve cada "pedaço" de texto separadamente, não a linha
    // inteira pronta.
    const porLinha = new Map<number, { x: number; texto: string }[]>()
    for (const item of conteudo.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const chaveLinha = Math.round(y / 3) * 3 // tolera pequenas variações de alinhamento
      if (!porLinha.has(chaveLinha)) porLinha.set(chaveLinha, [])
      porLinha.get(chaveLinha)!.push({ x: item.transform[4], texto: item.str })
    }

    const linhasDaPagina = [...porLinha.entries()]
      .sort((a, b) => b[0] - a[0]) // de cima para baixo
      .map(([, itens]) =>
        itens
          .sort((a, b) => a.x - b.x)
          .map((i) => i.texto)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean)

    linhas.push(...linhasDaPagina)
  }

  return linhas
}

// Convenção adotada (a mais comum em extratos/faturas brasileiros):
// sufixo "D" ou "-" depois do valor = débito = saída; sufixo "C" = crédito
// = entrada. Sem nenhuma marca (número "seco", como em toda linha de uma
// fatura de cartão comum) tratamos como saída, por ser o caso mais frequente.
function converterValorEDefinirTipo(bruto: string, sufixo: string | undefined): { valor: number; tipo: 'entrada' | 'saida' } {
  const valor = Number(bruto.replace(/\./g, '').replace(',', '.'))
  const tipo: 'entrada' | 'saida' = sufixo?.toLowerCase() === 'c' ? 'entrada' : 'saida'
  return { valor, tipo }
}

/** Data ISO a partir de "DD/MM", "DD/MM/AA" ou "DD/MM/AAAA", usando o ano de referência quando faltar. */
function converterData(dataBruta: string, anoReferencia: number): string {
  const partes = dataBruta.split('/')
  const dia = partes[0].padStart(2, '0')
  const mes = partes[1].padStart(2, '0')
  let ano = anoReferencia
  if (partes[2]) {
    ano = partes[2].length === 2 ? 2000 + Number(partes[2]) : Number(partes[2])
  }
  return `${ano}-${mes}-${dia}`
}

async function calcularHash(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Interpreta as linhas de texto extraídas do PDF e devolve os lançamentos
 * reconhecidos. `anoReferencia` é usado quando o extrato só mostra dia/mês
 * (comum em faturas de cartão).
 */
export async function interpretarLinhasExtrato(linhas: string[], anoReferencia: number): Promise<ResultadoImportacaoPdf> {
  const encontrados: LinhaImportada[] = []
  let linhasIgnoradas = 0

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim()
    if (!linha) continue

    const match = linha.match(REGEX_LINHA)
    if (!match) {
      if (REGEX_DATA_INICIAL.test(linha.split(/\s+/)[0] ?? '')) linhasIgnoradas += 1
      continue
    }

    const [, dataBruta, descricaoBruta, valorBruto, sufixo] = match
    const descricao = descricaoBruta.trim()
    if (!descricao) {
      linhasIgnoradas += 1
      continue
    }

    const { valor, tipo } = converterValorEDefinirTipo(valorBruto, sufixo)
    if (!valor) {
      linhasIgnoradas += 1
      continue
    }

    const data = converterData(dataBruta, anoReferencia)
    const hash = await calcularHash(`${data}|${valor.toFixed(2)}|${descricao.toLowerCase()}`)

    encontrados.push({ data, descricao, valor, tipo, hash })
  }

  return { linhas: encontrados, linhasIgnoradas }
}
