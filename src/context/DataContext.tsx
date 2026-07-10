import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './AuthContext'
import type { Categoria, FormaPagamento, NovaCategoria, NovaFormaPagamento, NovaTransacao, Transacao } from '../types'

interface DataContextValue {
  transacoes: Transacao[]
  categorias: Categoria[]
  formasPagamento: FormaPagamento[]
  carregando: boolean
  erro: string | null
  recarregar: () => Promise<void>

  criarTransacao: (dados: NovaTransacao) => Promise<void>
  atualizarTransacao: (id: string, dados: Partial<NovaTransacao>) => Promise<void>
  excluirTransacao: (id: string) => Promise<void>

  criarCategoria: (dados: NovaCategoria) => Promise<void>
  atualizarCategoria: (id: string, dados: Partial<NovaCategoria>) => Promise<void>
  excluirCategoria: (id: string) => Promise<void>

  criarFormaPagamento: (dados: NovaFormaPagamento) => Promise<void>
  atualizarFormaPagamento: (id: string, dados: Partial<NovaFormaPagamento>) => Promise<void>
  excluirFormaPagamento: (id: string) => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

// Carrega e mantém em memória as transações, categorias e formas de
// pagamento da usuária logada, e expõe funções para criar/editar/excluir.
// Fica tudo centralizado aqui para as telas não precisarem repetir
// as mesmas chamadas ao Supabase.
export function DataProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id

  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(async () => {
    if (!userId) return
    setCarregando(true)
    setErro(null)

    const [transacoesRes, categoriasRes, formasRes] = await Promise.all([
      supabase.from('transacoes').select('*').order('data', { ascending: false }),
      supabase.from('categorias').select('*').order('nome', { ascending: true }),
      supabase.from('formas_pagamento').select('*').order('nome', { ascending: true }),
    ])

    const primeiroErro = transacoesRes.error || categoriasRes.error || formasRes.error
    if (primeiroErro) {
      setErro(primeiroErro.message)
      setCarregando(false)
      return
    }

    setTransacoes(transacoesRes.data ?? [])
    setCategorias(categoriasRes.data ?? [])
    setFormasPagamento(formasRes.data ?? [])
    setCarregando(false)
  }, [userId])

  useEffect(() => {
    if (userId) {
      recarregar()
    } else {
      setTransacoes([])
      setCategorias([])
      setFormasPagamento([])
      setCarregando(false)
    }
  }, [userId, recarregar])

  async function criarTransacao(dados: NovaTransacao) {
    if (!userId) return
    const { data, error } = await supabase
      .from('transacoes')
      .insert({ ...dados, user_id: userId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setTransacoes((atual) => [data as Transacao, ...atual].sort((a, b) => (a.data < b.data ? 1 : -1)))
  }

  async function atualizarTransacao(id: string, dados: Partial<NovaTransacao>) {
    const { data, error } = await supabase.from('transacoes').update(dados).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    setTransacoes((atual) => atual.map((t) => (t.id === id ? (data as Transacao) : t)))
  }

  async function excluirTransacao(id: string) {
    const { error } = await supabase.from('transacoes').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setTransacoes((atual) => atual.filter((t) => t.id !== id))
  }

  async function criarCategoria(dados: NovaCategoria) {
    if (!userId) return
    const { data, error } = await supabase
      .from('categorias')
      .insert({ ...dados, user_id: userId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCategorias((atual) => [...atual, data as Categoria].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function atualizarCategoria(id: string, dados: Partial<NovaCategoria>) {
    const { data, error } = await supabase.from('categorias').update(dados).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    setCategorias((atual) => atual.map((c) => (c.id === id ? (data as Categoria) : c)))
  }

  async function excluirCategoria(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setCategorias((atual) => atual.filter((c) => c.id !== id))
  }

  async function criarFormaPagamento(dados: NovaFormaPagamento) {
    if (!userId) return
    const { data, error } = await supabase
      .from('formas_pagamento')
      .insert({ ...dados, user_id: userId })
      .select()
      .single()
    if (error) throw new Error(error.message)
    setFormasPagamento((atual) => [...atual, data as FormaPagamento].sort((a, b) => a.nome.localeCompare(b.nome)))
  }

  async function atualizarFormaPagamento(id: string, dados: Partial<NovaFormaPagamento>) {
    const { data, error } = await supabase.from('formas_pagamento').update(dados).eq('id', id).select().single()
    if (error) throw new Error(error.message)
    setFormasPagamento((atual) => atual.map((f) => (f.id === id ? (data as FormaPagamento) : f)))
  }

  async function excluirFormaPagamento(id: string) {
    const { error } = await supabase.from('formas_pagamento').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setFormasPagamento((atual) => atual.filter((f) => f.id !== id))
  }

  return (
    <DataContext.Provider
      value={{
        transacoes,
        categorias,
        formasPagamento,
        carregando,
        erro,
        recarregar,
        criarTransacao,
        atualizarTransacao,
        excluirTransacao,
        criarCategoria,
        atualizarCategoria,
        excluirCategoria,
        criarFormaPagamento,
        atualizarFormaPagamento,
        excluirFormaPagamento,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const contexto = useContext(DataContext)
  if (!contexto) {
    throw new Error('useData precisa ser usado dentro de um <DataProvider>')
  }
  return contexto
}
