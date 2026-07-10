import { useState, type FormEvent } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { proximaCorSugerida } from '../lib/paletaCategorias'
import { IconeLixeira, IconeSair } from '../components/icones'
import type { TipoCategoria, TipoFormaPagamento } from '../types'

// Tela onde a usuária cadastra e ajusta suas próprias categorias e
// formas de pagamento — o que alimenta os menus usados no resto do app.
// Para adicionar um novo TIPO de categoria (além de entrada/saída/ambos),
// edite o array `TIPOS_CATEGORIA` abaixo.
const TIPOS_CATEGORIA: { valor: TipoCategoria; rotulo: string }[] = [
  { valor: 'entrada', rotulo: 'Entrada' },
  { valor: 'saida', rotulo: 'Saída' },
  { valor: 'ambos', rotulo: 'Ambos' },
]

const TIPOS_FORMA: { valor: TipoFormaPagamento; rotulo: string }[] = [
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'cartao', rotulo: 'Cartão' },
  { valor: 'pix', rotulo: 'PIX' },
  { valor: 'outro', rotulo: 'Outro' },
]

export default function Configuracoes() {
  const { session } = useAuth()

  return (
    <div className="flex flex-col gap-8 pb-4">
      <h1 className="text-xl font-semibold text-cafe-800">Ajustes</h1>

      <SecaoCategorias />
      <SecaoFormasPagamento />

      <section className="rounded-xl border border-bege-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-cafe-700">Conta</h2>
        <p className="mb-3 truncate text-sm text-cafe-500">{session?.user.email}</p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 rounded-xl border border-bege-200 px-4 py-2.5 text-sm font-medium text-cafe-600"
        >
          <IconeSair className="h-4 w-4" />
          Sair da conta
        </button>
      </section>
    </div>
  )
}

function SecaoCategorias() {
  const { categorias, criarCategoria, excluirCategoria } = useData()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCategoria>('saida')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    setErro(null)
    setSalvando(true)
    try {
      await criarCategoria({ nome: nome.trim(), tipo, cor: proximaCorSugerida(categorias.length), icone: null })
      setNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir(id: string) {
    if (!confirm('Remover esta categoria? Lançamentos antigos ficarão sem categoria.')) return
    await excluirCategoria(id)
  }

  return (
    <section className="rounded-xl border border-bege-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-cafe-700">Categorias</h2>

      <ul className="mb-4 flex flex-col gap-1.5">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-bege-50 px-3 py-2">
            <span className="flex items-center gap-2 text-sm text-cafe-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
              {c.nome}
              <span className="text-xs text-cafe-400">
                ({TIPOS_CATEGORIA.find((t) => t.valor === c.tipo)?.rotulo})
              </span>
            </span>
            <button type="button" onClick={() => aoExcluir(c.id)} aria-label="Excluir categoria" className="shrink-0 text-cafe-400 hover:text-terracota-600">
              <IconeLixeira className="h-4 w-4" />
            </button>
          </li>
        ))}
        {categorias.length === 0 && <p className="text-sm text-cafe-500">Nenhuma categoria ainda.</p>}
      </ul>

      <form onSubmit={aoEnviar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nova categoria"
            className="flex-1 rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoCategoria)}
            className="rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            {TIPOS_CATEGORIA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-xs text-terracota-600">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar categoria
        </button>
      </form>
    </section>
  )
}

function SecaoFormasPagamento() {
  const { formasPagamento, criarFormaPagamento, excluirFormaPagamento } = useData()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoFormaPagamento>('cartao')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    if (!nome.trim()) return
    setErro(null)
    setSalvando(true)
    try {
      await criarFormaPagamento({ nome: nome.trim(), tipo })
      setNome('')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function aoExcluir(id: string) {
    if (!confirm('Remover esta forma de pagamento? Lançamentos antigos ficarão sem forma de pagamento.')) return
    await excluirFormaPagamento(id)
  }

  return (
    <section className="rounded-xl border border-bege-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-cafe-700">Formas de pagamento</h2>

      <ul className="mb-4 flex flex-col gap-1.5">
        {formasPagamento.map((f) => (
          <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-bege-50 px-3 py-2">
            <span className="text-sm text-cafe-700">
              {f.nome} <span className="text-xs text-cafe-400">({TIPOS_FORMA.find((t) => t.valor === f.tipo)?.rotulo})</span>
            </span>
            <button
              type="button"
              onClick={() => aoExcluir(f.id)}
              aria-label="Excluir forma de pagamento"
              className="shrink-0 text-cafe-400 hover:text-terracota-600"
            >
              <IconeLixeira className="h-4 w-4" />
            </button>
          </li>
        ))}
        {formasPagamento.length === 0 && <p className="text-sm text-cafe-500">Nenhuma forma de pagamento ainda.</p>}
      </ul>

      <form onSubmit={aoEnviar} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nova forma de pagamento"
            className="flex-1 rounded-lg border border-bege-200 px-3 py-2 text-sm text-cafe-800 outline-none focus:border-oliva-500"
          />
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoFormaPagamento)}
            className="rounded-lg border border-bege-200 px-2 py-2 text-sm text-cafe-700 outline-none focus:border-oliva-500"
          >
            {TIPOS_FORMA.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
        </div>
        {erro && <p className="text-xs text-terracota-600">{erro}</p>}
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-oliva-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Adicionar forma de pagamento
        </button>
      </form>
    </section>
  )
}
