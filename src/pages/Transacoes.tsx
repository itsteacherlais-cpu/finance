import { useMemo, useState } from 'react'
import { useData } from '../context/DataContext'
import FiltroPeriodo, { calcularIntervalo } from '../components/FiltroPeriodo'
import ModalEdicaoTransacao from '../components/ModalEdicaoTransacao'
import { formatarDataCurta, formatarMoeda, hojeISO } from '../lib/formatacao'
import { RotulosPeriodo, type IntervaloDatas, type OpcaoPeriodo } from '../lib/periodos'
import { exportarTransacoesCsv } from '../lib/exportarCsv'
import { IconeDownload, IconeImpressora, IconeLapis } from '../components/icones'
import type { Transacao } from '../types'

// Lista completa de lançamentos, com filtro por período e por forma de
// pagamento (ex: "quanto foi no cartão do namorado esse mês?"), opção de
// editar/excluir cada item, e exportação para CSV (Excel) ou PDF (impressão).
export default function Transacoes() {
  const { transacoes, categorias, formasPagamento, carregando } = useData()

  const [opcaoPeriodo, setOpcaoPeriodo] = useState<OpcaoPeriodo>('mes-atual')
  const [personalizado, setPersonalizado] = useState<IntervaloDatas>({ inicio: hojeISO(), fim: hojeISO() })
  const [formaFiltro, setFormaFiltro] = useState('todas')
  const [editando, setEditando] = useState<Transacao | null>(null)

  const intervalo = calcularIntervalo(opcaoPeriodo, personalizado)

  const nomeCategoria = (id: string | null) => categorias.find((c) => c.id === id)?.nome ?? 'Sem categoria'
  const nomeFormaPagamento = (id: string | null) => formasPagamento.find((f) => f.id === id)?.nome ?? 'Sem forma de pagamento'
  const nomeFormaFiltrada = formaFiltro === 'todas' ? 'Todas as formas de pagamento' : nomeFormaPagamento(formaFiltro)

  const transacoesFiltradas = useMemo(() => {
    return transacoes
      .filter((t) => t.data >= intervalo.inicio && t.data <= intervalo.fim)
      .filter((t) => formaFiltro === 'todas' || t.forma_pagamento_id === formaFiltro)
  }, [transacoes, intervalo.inicio, intervalo.fim, formaFiltro])

  const totalEntradas = transacoesFiltradas.filter((t) => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  const totalSaidas = transacoesFiltradas.filter((t) => t.tipo === 'saida').reduce((s, t) => s + t.valor, 0)
  const total = totalEntradas - totalSaidas

  function baixarCsv() {
    const nomeArquivo = `lancamentos-${intervalo.inicio}-a-${intervalo.fim}.csv`
    exportarTransacoesCsv(transacoesFiltradas, categorias, formasPagamento, nomeArquivo)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 print:hidden">
        <h1 className="text-xl font-semibold text-cafe-800">Transações</h1>

        <div className="flex flex-col gap-2">
          <FiltroPeriodo
            opcao={opcaoPeriodo}
            personalizado={personalizado}
            onMudarOpcao={setOpcaoPeriodo}
            onMudarPersonalizado={setPersonalizado}
          />
          <select
            value={formaFiltro}
            onChange={(e) => setFormaFiltro(e.target.value)}
            className="w-fit rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            <option value="todas">Todas as formas de pagamento</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-bege-200 bg-white px-4 py-3">
          <span className="text-sm text-cafe-500">Saldo do período</span>
          <p className={`text-xl font-semibold ${total >= 0 ? 'text-oliva-600' : 'text-terracota-600'}`}>{formatarMoeda(total)}</p>
        </div>

        {transacoesFiltradas.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={baixarCsv}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm font-medium text-cafe-600"
            >
              <IconeDownload className="h-4 w-4" />
              Baixar CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bege-200 bg-white px-3 py-2 text-sm font-medium text-cafe-600"
            >
              <IconeImpressora className="h-4 w-4" />
              Imprimir / PDF
            </button>
          </div>
        )}

        {carregando && <p className="text-sm text-cafe-500">Carregando...</p>}

        {!carregando && transacoesFiltradas.length === 0 && (
          <p className="rounded-xl border border-dashed border-bege-200 px-4 py-8 text-center text-sm text-cafe-500">
            Nenhum lançamento neste período.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {transacoesFiltradas.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-bege-200 bg-white px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-cafe-800">{nomeCategoria(t.categoria_id)}</p>
                <p className="truncate text-xs text-cafe-500">
                  {formatarDataCurta(t.data)} · {nomeFormaPagamento(t.forma_pagamento_id)}
                  {t.descricao ? ` · ${t.descricao}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`font-semibold ${t.tipo === 'entrada' ? 'text-oliva-600' : 'text-terracota-600'}`}>
                  {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(t.valor)}
                </span>
                <button type="button" onClick={() => setEditando(t)} aria-label="Editar lançamento" className="text-cafe-400 hover:text-cafe-600">
                  <IconeLapis className="h-5 w-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Só aparece na hora de imprimir / salvar em PDF (veja botão "Imprimir / PDF" acima). */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold text-black">Relatório de lançamentos</h1>
        <p className="text-sm text-black">
          Período: {RotulosPeriodo[opcaoPeriodo]} ({formatarDataCurta(intervalo.inicio)} a {formatarDataCurta(intervalo.fim)}) ·{' '}
          {nomeFormaFiltrada}
        </p>
        <p className="mt-2 text-sm text-black">
          Entradas: {formatarMoeda(totalEntradas)} · Saídas: {formatarMoeda(totalSaidas)} · Saldo:{' '}
          <strong>{formatarMoeda(total)}</strong>
        </p>

        <table className="mt-4 w-full border-collapse text-sm text-black">
          <thead>
            <tr className="border-b border-black/40 text-left">
              <th className="py-1 pr-2">Data</th>
              <th className="py-1 pr-2">Categoria</th>
              <th className="py-1 pr-2">Forma de pagamento</th>
              <th className="py-1 pr-2">Descrição</th>
              <th className="py-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transacoesFiltradas.map((t) => (
              <tr key={t.id} className="border-b border-black/10">
                <td className="py-1 pr-2">{formatarDataCurta(t.data)}</td>
                <td className="py-1 pr-2">{nomeCategoria(t.categoria_id)}</td>
                <td className="py-1 pr-2">{nomeFormaPagamento(t.forma_pagamento_id)}</td>
                <td className="py-1 pr-2">{t.descricao ?? ''}</td>
                <td className="py-1 text-right">
                  {t.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(t.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editando && <ModalEdicaoTransacao transacao={editando} aoFechar={() => setEditando(null)} />}
    </div>
  )
}
