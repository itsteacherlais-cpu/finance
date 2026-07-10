import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'

// Tela de entrada do app: em vez de "criar conta"/e-mail, a usuária só
// digita um PIN único (definido nas variáveis de ambiente, veja
// .env.example). Por trás, o app usa uma única conta fixa do Supabase
// (também guardada em variáveis de ambiente) para continuar aproveitando
// a sincronização e as regras de segurança (RLS) do banco — a usuária
// nunca vê nem precisa saber dessa conta.
//
// Importante: essa tela é uma trava simples, não um sistema de segurança
// forte — o PIN fica embutido no código do site (como qualquer coisa que
// roda só no navegador). Ela serve para afastar acesso casual de quem não
// conhece o PIN, não para proteger contra alguém tecnicamente decidido a
// invadir. Não compartilhe o link do site publicamente.
export default function BloqueioPin() {
  const [pin, setPin] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function aoEnviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)

    const pinEsperado = import.meta.env.VITE_APP_PIN
    const email = import.meta.env.VITE_APP_EMAIL
    const senha = import.meta.env.VITE_APP_PASSWORD

    if (!pinEsperado || !email || !senha) {
      setErro('O app não está configurado direito (faltam variáveis VITE_APP_PIN / VITE_APP_EMAIL / VITE_APP_PASSWORD).')
      return
    }

    if (pin !== pinEsperado) {
      setErro('PIN incorreto.')
      return
    }

    setCarregando(true)

    // Primeiro tenta entrar na conta fixa. Se ela ainda não existir
    // (primeiro acesso, em qualquer aparelho), cria automaticamente.
    const { error: erroEntrar } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (erroEntrar) {
      const { error: erroCriar } = await supabase.auth.signUp({ email, password: senha })
      if (erroCriar) {
        setCarregando(false)
        setErro(
          erroCriar.message.includes('User already registered')
            ? 'A conta interna já existe mas a senha não bateu. Confira se VITE_APP_PASSWORD está igual em todos os aparelhos/deploys.'
            : erroCriar.message,
        )
        return
      }
    }

    setCarregando(false)
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-bege-50 px-6 py-12">
      <div className="w-full max-w-xs">
        <h1 className="mb-1 text-center text-2xl font-semibold text-cafe-800">Meu Financeiro</h1>
        <p className="mb-8 text-center text-sm text-cafe-500">Digite o PIN para abrir</p>

        <form onSubmit={aoEnviar} className="flex flex-col gap-4">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            required
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full rounded-xl border border-bege-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.3em] text-cafe-800 outline-none focus:border-oliva-500"
          />

          {erro && <p className="rounded-lg bg-terracota-500/10 px-3 py-2 text-center text-sm text-terracota-600">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="rounded-xl bg-oliva-600 px-4 py-3 font-medium text-white transition hover:bg-oliva-700 disabled:opacity-60"
          >
            {carregando ? 'Abrindo...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
