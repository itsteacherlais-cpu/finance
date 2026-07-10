import { useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import type { Transacao } from '../types'

interface Props {
  transacao: Transacao
  aoFechar: () => void
}

// Painel simples para editar um lançamento já existente. Abre por cima
// da tela de Transações quando a usuária toca no lápis de um item.
export default function ModalEdicaoTransacao({ transacao, aoFechar }: Props) {
  const { categorias, formasPagamento, atualizarTransacao, excluirTransacao } = useData()

  const [tipo, setTipo] = useState(transacao.tipo)
  const [valor, setValor] = useState(String(transacao.valor))
  const [categoriaId, setCategoriaId] = useState(transacao.categoria_id ?? '')
  const [formaPagamentoId, setFormaPagamentoId] = useState(transacao.forma_pagamento_id ?? '')
  const [data, setData] = useState(transacao.data)
  const [descricao, setDescricao] = useState(transacao.descricao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo || c.tipo === 'ambos')

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    const valorNumerico = Number(valor.replace(',', '.'))
    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Digite um valor válido, maior que zero.')
      return
    }

    setSalvando(true)
    try {
      await atualizarTransacao(transacao.id, {
        tipo,
        valor: valorNumerico,
        data,
        categoria_id: categoriaId || null,
        forma_pagamento_id: formaPagamentoId || null,
        descricao: descricao.trim() || null,
      })
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir() {
    if (!confirm('Excluir este lançamento? Essa ação não pode ser desfeita.')) return
    setSalvando(true)
    try {
      await excluirTransacao(transacao.id)
      aoFechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível excluir.')
      setSalvando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-cafe-900/40 sm:items-center" onClick={aoFechar}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-cafe-800">Editar lançamento</h2>

        <form onSubmit={aoEnviar} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('saida')}
              className={`rounded-xl border py-2.5 font-medium ${
                tipo === 'saida' ? 'border-terracota-500 bg-terracota-500 text-white' : 'border-bege-200 bg-white text-cafe-600'
              }`}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`rounded-xl border py-2.5 font-medium ${
                tipo === 'entrada' ? 'border-oliva-600 bg-oliva-600 text-white' : 'border-bege-200 bg-white text-cafe-600'
              }`}
            >
              Entrada
            </button>
          </div>

          <input
            inputMode="decimal"
            required
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-xl border border-bege-200 px-4 py-3 text-lg font-semibold text-cafe-800 outline-none focus:border-oliva-500"
          />

          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          >
            <option value="">Sem categoria</option>
            {categoriasDoTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          <select
            value={formaPagamentoId}
            onChange={(e) => setFormaPagamentoId(e.target.value)}
            className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          >
            <option value="">Sem forma de pagamento</option>
            {formasPagamento.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>

          <input
            type="date"
            required
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          />

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição (opcional)"
            className="w-full rounded-xl border border-bege-200 px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
          />

          {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-sm text-terracota-600">{erro}</p>}

          <div className="mt-1 flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={aoExcluir}
              disabled={salvando}
              className="rounded-xl border border-terracota-500 px-4 py-3 font-medium text-terracota-600 disabled:opacity-60"
            >
              Excluir
            </button>
            <button type="button" onClick={aoFechar} className="rounded-xl border border-bege-200 px-4 py-3 font-medium text-cafe-600">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
