import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { construirIndiceCategorizacao, sugerirCategoria } from '../lib/categorizacaoAutomatica'
import { extrairLinhasDoPdf, interpretarLinhasExtrato } from '../lib/importarExtrato'
import { IconeUpload } from '../components/icones'
import type { NovaTransacao } from '../types'

type Etapa = 'selecionar' | 'processando' | 'concluido'

export default function ImportarExtrato() {
  const { categorias, formasPagamento, transacoes, importarTransacoes } = useData()
  const navegar = useNavigate()

  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear())
  const [formaPagamentoId, setFormaPagamentoId] = useState('')
  const [etapa, setEtapa] = useState<Etapa>('selecionar')
  const [erro, setErro] = useState<string | null>(null)
  const [resumo, setResumo] = useState<{
    inseridas: number
    duplicadas: number
    categorizadasAutomaticamente: number
    ignoradas: number
  } | null>(null)

  async function aoSelecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0]
    evento.target.value = '' // permite selecionar o mesmo arquivo de novo depois
    if (!arquivo) return

    setErro(null)
    setEtapa('processando')

    try {
      const linhasDeTexto = await extrairLinhasDoPdf(arquivo)
      const { linhas, linhasIgnoradas } = await interpretarLinhasExtrato(linhasDeTexto, anoReferencia)

      if (linhas.length === 0) {
        setErro('Não conseguimos reconhecer nenhum lançamento neste PDF. O layout desse extrato pode ser diferente do esperado — você pode lançar manualmente em "Novo".')
        setEtapa('selecionar')
        return
      }

      const indice = construirIndiceCategorizacao(transacoes)
      let categorizadasAutomaticamente = 0

      const novasTransacoes: NovaTransacao[] = linhas.map((linha) => {
        const categoriaSugerida = sugerirCategoria(indice, linha.descricao)
        const categoria = categoriaSugerida ? categorias.find((c) => c.id === categoriaSugerida) : undefined
        const categoriaValida = categoria && (categoria.tipo === linha.tipo || categoria.tipo === 'ambos') ? categoria.id : null
        if (categoriaValida) categorizadasAutomaticamente += 1

        return {
          tipo: linha.tipo,
          valor: linha.valor,
          data: linha.data,
          categoria_id: categoriaValida,
          forma_pagamento_id: formaPagamentoId || null,
          descricao: linha.descricao,
          recorrente: false,
          origem: 'importado',
          hash_importacao: linha.hash,
        }
      })

      const { inseridas, duplicadas } = await importarTransacoes(novasTransacoes)
      setResumo({ inseridas, duplicadas, categorizadasAutomaticamente, ignoradas: linhasIgnoradas })
      setEtapa('concluido')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler este arquivo.')
      setEtapa('selecionar')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-cafe-800">Importar extrato</h1>
      <p className="text-sm text-cafe-500">
        Envie o PDF do extrato do banco ou da fatura do cartão. A gente tenta reconhecer data, descrição e valor de cada
        lançamento automaticamente, e sugere a categoria com base no que você já categorizou antes. Tudo importado entra na
        lista de Transações, já pronto para você revisar e ajustar o que precisar.
      </p>

      {etapa !== 'concluido' && (
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="ano-referencia" className="mb-1 block text-sm font-medium text-cafe-700">
              Ano de referência
            </label>
            <input
              id="ano-referencia"
              type="number"
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(Number(e.target.value))}
              className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            />
            <p className="mt-1 text-xs text-cafe-500">Usado quando o extrato só mostra dia e mês (comum em faturas de cartão).</p>
          </div>

          <div>
            <label htmlFor="forma-pagamento" className="mb-1 block text-sm font-medium text-cafe-700">
              Forma de pagamento deste extrato (opcional)
            </label>
            <select
              id="forma-pagamento"
              value={formaPagamentoId}
              onChange={(e) => setFormaPagamentoId(e.target.value)}
              className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
            >
              <option value="">Sem forma de pagamento</option>
              {formasPagamento.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-cafe-500">Vai ser aplicada em todos os lançamentos deste arquivo.</p>
          </div>

          <label
            htmlFor="arquivo-extrato"
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center ${
              etapa === 'processando' ? 'border-bege-200 text-cafe-400' : 'cursor-pointer border-oliva-400 text-oliva-700'
            }`}
          >
            <IconeUpload className="h-8 w-8" />
            <span className="font-medium">{etapa === 'processando' ? 'Lendo o arquivo...' : 'Escolher PDF do extrato'}</span>
            <input
              id="arquivo-extrato"
              type="file"
              accept="application/pdf"
              disabled={etapa === 'processando'}
              onChange={aoSelecionarArquivo}
              className="hidden"
            />
          </label>

          {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-sm text-terracota-600">{erro}</p>}
        </div>
      )}

      {etapa === 'concluido' && resumo && (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-oliva-400 bg-oliva-500/10 px-4 py-3 text-oliva-700">
            <p className="font-medium">{resumo.inseridas} lançamento(s) importado(s)!</p>
            <p className="text-sm">
              {resumo.categorizadasAutomaticamente} já vieram com categoria sugerida automaticamente
              {resumo.inseridas > resumo.categorizadasAutomaticamente
                ? `, ${resumo.inseridas - resumo.categorizadasAutomaticamente} ficaram sem categoria`
                : ''}
              .
            </p>
          </div>

          {resumo.duplicadas > 0 && (
            <p className="rounded-lg bg-bege-100 px-3 py-2 text-sm text-cafe-600">
              {resumo.duplicadas} linha(s) pareciam já ter sido importadas antes (mesma data, valor e descrição) e foram
              ignoradas para não duplicar.
            </p>
          )}

          {resumo.ignoradas > 0 && (
            <p className="rounded-lg bg-bege-100 px-3 py-2 text-sm text-cafe-600">
              {resumo.ignoradas} linha(s) do PDF não foram reconhecidas e precisam ser lançadas manualmente, se forem
              lançamentos de verdade.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navegar('/transacoes')}
              className="flex-1 rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white hover:bg-oliva-700"
            >
              Revisar transações
            </button>
            <button
              type="button"
              onClick={() => {
                setResumo(null)
                setEtapa('selecionar')
              }}
              className="rounded-xl border border-bege-200 bg-white px-4 py-3 font-medium text-cafe-600"
            >
              Importar outro
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
