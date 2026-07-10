import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tela de entrada. Como é um app pessoal, o mais comum é usar sempre
// "Entrar" — o botão "Criar conta" só é necessário na primeira vez.
export default function Login() {
  const [modo, setModo] = useState<'entrar' | 'criar-conta'>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setMensagem(null)
    setCarregando(true)

    const { error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({ email, password: senha })

    setCarregando(false)

    if (error) {
      setErro(traduzErro(error.message))
      return
    }

    if (modo === 'criar-conta') {
      setMensagem('Conta criada! Verifique seu e-mail para confirmar (se a confirmação estiver ativada) e depois faça login.')
    }
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bege-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-cafe-800">Meu Financeiro</h1>
        <p className="mb-8 text-center text-sm text-cafe-500">
          {modo === 'entrar' ? 'Entre para acessar seus dados' : 'Crie sua conta para começar'}
        </p>

        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-cafe-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-cafe-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={6}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-cafe-800 outline-none focus:border-oliva-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-sm text-terracota-600">{erro}</p>}
          {mensagem && <p className="rounded-lg bg-oliva-500/10 px-3 py-2 text-sm text-oliva-700">{mensagem}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white transition hover:bg-oliva-700 disabled:opacity-60"
          >
            {carregando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar-conta' : 'entrar')
            setErro(null)
            setMensagem(null)
          }}
          className="mt-4 w-full text-center text-sm text-cafe-500 underline-offset-2 hover:underline"
        >
          {modo === 'entrar' ? 'Ainda não tem conta? Criar uma agora' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )
}

function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (mensagem.includes('User already registered')) return 'Já existe uma conta com esse e-mail.'
  if (mensagem.includes('Password should be at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return mensagem
}
