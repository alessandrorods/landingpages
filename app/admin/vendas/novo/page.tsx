'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { PERIODOS_ENTREGA } from '@/constants/pedido'
import type { FormaPagamento, PedidoManualItem } from '@/app/api/admin/orders/create/route'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoToTiny(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function todayBRT(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' })
}

function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '')
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim().replace(/-$/, '')
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Req() {
  return <span className="text-red-500 ml-0.5">*</span>
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
      {children}{required && <Req />}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${props.className ?? ''}`}
    />
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="border-t border-gray-100" />
}

// ── Busca de produto ──────────────────────────────────────────────────────────

interface ProdutoBuscado { id: number; sku: string; nome: string; preco: number }

function BuscaProduto({ onSelect }: { onSelect: (p: ProdutoBuscado) => void }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultados, setResultados] = useState<ProdutoBuscado[]>([])
  const [err, setErr] = useState('')
  const [buscou, setBuscou] = useState(false)

  async function buscar() {
    const termo = q.trim()
    if (!termo) return
    setLoading(true)
    setErr('')
    setResultados([])
    setBuscou(false)
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(termo)}`)
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Erro ao buscar'); return }
      setResultados(data.produtos ?? [])
      setBuscou(true)
      if ((data.produtos ?? []).length === 1) {
        onSelect(data.produtos[0])
        setQ('')
        setResultados([])
        setBuscou(false)
      }
    } catch {
      setErr('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => { setQ(e.target.value); setResultados([]); setBuscou(false) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); buscar() } }}
          placeholder="SKU ou nome do produto"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={loading || !q.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Buscar'}
        </button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {buscou && resultados.length === 0 && <p className="text-sm text-gray-500">Nenhum produto encontrado</p>}
      {resultados.length > 1 && (
        <div className="border border-gray-100 rounded-xl overflow-y-auto max-h-52">
          {resultados.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onSelect(p); setQ(''); setResultados([]); setBuscou(false) }}
              className="w-full text-left px-4 py-3 hover:bg-orange-50 border-b border-gray-50 last:border-0 transition-colors"
            >
              <span className="text-xs font-mono text-gray-400 mr-2">{p.sku}</span>
              <span className="text-sm font-medium text-gray-900">{p.nome}</span>
              <span className="float-right text-sm text-gray-500">{brl(p.preco)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Lista de itens ────────────────────────────────────────────────────────────

function ListaItens({ itens, onUpdatePreco, onUpdateQtd, onRemover }: {
  itens: PedidoManualItem[]
  onUpdatePreco: (idx: number, v: string) => void
  onUpdateQtd: (idx: number, v: string) => void
  onRemover: (idx: number) => void
}) {
  if (itens.length === 0) return null

  return (
    <div className="space-y-2">
      {itens.map((item, idx) => (
        <div key={idx} className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {item.sku && <p className="text-xs font-mono text-gray-400">{item.sku}</p>}
              <p className="text-sm font-medium text-gray-900 leading-snug">{item.nome}</p>
            </div>
            <button
              type="button"
              onClick={() => onRemover(idx)}
              className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0 mt-0.5 transition-colors"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Qtd</Label>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                value={item.quantidade}
                onChange={(e) => onUpdateQtd(idx, e.target.value)}
                className="py-2 text-sm"
              />
            </div>
            <div>
              <Label>Preço unit. (R$)</Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={item.preco}
                onChange={(e) => onUpdatePreco(idx, e.target.value)}
                className="py-2 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Sucesso ───────────────────────────────────────────────────────────────────

function Sucesso({ id, numero, linkPagamento, telefone, onNovo }: {
  id: number; numero: string; linkPagamento?: string; telefone: string; onNovo: () => void
}) {
  const [copiado, setCopiado] = useState(false)
  const [copiadoConfirmacao, setCopiadoConfirmacao] = useState(false)

  function copiar() {
    if (!linkPagamento) return
    navigator.clipboard.writeText(linkPagamento).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  function copiarConfirmacao() {
    const msg = `Obrigado por sua compra!\n\n➡️ O número do seu pedido é *${numero}*\n\nAcompanhe seu pedido pelo link abaixo:\nhttps://florapp.com.br/tracking/${id}`
    navigator.clipboard.writeText(msg).then(() => {
      setCopiadoConfirmacao(true)
      setTimeout(() => setCopiadoConfirmacao(false), 2500)
    })
  }

  const foneNumero = telefone.replace(/\D/g, '')
  const msg = linkPagamento
    ? encodeURIComponent(`Olá! Segue o link para pagamento do pedido #${numero}: ${linkPagamento}`)
    : ''

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
      <p className="text-3xl">✓</p>
      <p className="text-lg font-bold text-gray-900">Pedido #{numero} criado!</p>
      {linkPagamento && (
        <div className="space-y-2 text-left">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Link de pagamento</p>
          <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-600 break-all">{linkPagamento}</div>
          <div className="flex gap-2">
            <button
              onClick={copiar}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {copiado ? '✓ Copiado!' : 'Copiar link'}
            </button>
            {foneNumero && (
              <a
                href={`https://wa.me/55${foneNumero}?text=${msg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Enviar WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
      <button
        onClick={copiarConfirmacao}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {copiadoConfirmacao ? '✓ Copiado!' : 'Copiar mensagem de confirmação'}
      </button>
      <button
        onClick={onNovo}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-xl text-sm transition-colors"
      >
        Novo pedido
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NovoPedidoPage() {
  const today = todayBRT()

  // comprador
  const [comprNome, setComprNome] = useState('')
  const [comprTel, setComprTel] = useState('')

  // produtos
  const [itens, setItens] = useState<PedidoManualItem[]>([])

  // endereço
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [logradouro, setLogradouro] = useState('')
  const [numEnd, setNumEnd] = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro] = useState('')
  const [dataEntrega, setDataEntrega] = useState(today)
  const [periodo, setPeriodo] = useState('')
  const [frete, setFrete] = useState('15')

  // destinatário
  const [paraOutra, setParaOutra] = useState(false)
  const [destNome, setDestNome] = useState('')
  const [destTel, setDestTel] = useState('')
  const [comMensagem, setComMensagem] = useState(false)
  const [mensagem, setMensagem] = useState('')

  // obs + pagamento
  const [obs, setObs] = useState('')
  const [pagamento, setPagamento] = useState<FormaPagamento>('pix')

  // submit
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState<{ id: number; numero: string; linkPagamento?: string } | null>(null)

  const topRef = useRef<HTMLDivElement>(null)

  async function buscarCep(raw: string) {
    const c = raw.replace(/\D/g, '')
    setCep(raw)
    if (c.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${c}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setLogradouro(data.logradouro ?? '')
        setBairro(data.bairro ?? '')
      }
    } catch {
      // silencioso
    } finally {
      setCepLoading(false)
    }
  }

  function adicionarProduto(p: ProdutoBuscado) {
    setItens((prev) => {
      const idx = prev.findIndex((i) => i.sku && i.sku === p.sku)
      if (idx >= 0) return prev.map((i, n) => n === idx ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { sku: p.sku, nome: p.nome, preco: p.preco, quantidade: 1 }]
    })
  }

  function updatePreco(idx: number, v: string) {
    const preco = parseFloat(v)
    if (!isNaN(preco)) setItens((prev) => prev.map((i, n) => n === idx ? { ...i, preco } : i))
  }

  function updateQtd(idx: number, v: string) {
    const quantidade = parseInt(v)
    if (!isNaN(quantidade) && quantidade >= 1) setItens((prev) => prev.map((i, n) => n === idx ? { ...i, quantidade } : i))
  }

  function removerItem(idx: number) {
    setItens((prev) => prev.filter((_, n) => n !== idx))
  }

  function resetar() {
    setComprNome(''); setComprTel('')
    setItens([])
    setParaOutra(false); setDestNome(''); setDestTel('')
    setComMensagem(false); setMensagem('')
    setCep(''); setLogradouro(''); setNumEnd(''); setComplemento(''); setBairro('')
    setDataEntrega(todayBRT()); setPeriodo(''); setFrete('15')
    setObs(''); setPagamento('pix')
    setErro(''); setResultado(null)
    topRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const subtotal = itens.reduce((s, i) => s + i.preco * i.quantidade, 0)
  const freteNum = parseFloat(frete) || 0
  const total = subtotal + freteNum

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (itens.length === 0) { setErro('Adicione ao menos um produto'); return }
    if (isNaN(freteNum) || freteNum < 0) { setErro('Frete inválido'); return }

    setLoading(true)
    setErro('')
    try {
      const body = {
        itens,
        frete: freteNum,
        endereco: {
          cep: cep.replace(/\D/g, ''),
          logradouro,
          numero: numEnd,
          complemento: complemento || undefined,
          bairro,
          dataEntrega: isoToTiny(dataEntrega),
          periodoEntrega: periodo,
        },
        destinatario: {
          paraOutraPessoa: paraOutra,
          nome: paraOutra ? destNome : comprNome,
          telefone: (paraOutra ? destTel : comprTel).replace(/\D/g, ''),
          mensagemCartao: comMensagem && mensagem.trim() ? mensagem.trim() : undefined,
        },
        comprador: { nome: comprNome, telefone: comprTel.replace(/\D/g, '') },
        obs: obs.trim() || undefined,
        pagamento,
      }

      const res = await fetch('/api/admin/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error ?? 'Erro ao criar pedido'); return }
      setResultado({ id: data.id, numero: data.numero, linkPagamento: data.linkPagamento })
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  if (resultado) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-4">Novo Pedido</h1>
        <Sucesso id={resultado.id} numero={resultado.numero} linkPagamento={resultado.linkPagamento} telefone={comprTel} onNovo={resetar} />
      </div>
    )
  }

  return (
    <div ref={topRef}>
      <div className="flex items-center gap-3 mb-4">
        <Link href="/admin/vendas" className="text-gray-400 hover:text-gray-600 text-sm">← Pedidos</Link>
        <h1 className="text-xl font-bold text-gray-900">Novo Pedido</h1>
      </div>

      <form onSubmit={submit} className="space-y-4">

        {/* Comprador */}
        <Section title="Comprador">
          <div>
            <Label required>Nome</Label>
            <Input value={comprNome} onChange={(e) => setComprNome(e.target.value)} placeholder="Nome completo" required />
          </div>
          <div>
            <Label required>Telefone</Label>
            <Input
              type="tel"
              inputMode="numeric"
              value={comprTel}
              onChange={(e) => setComprTel(maskPhone(e.target.value))}
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </Section>

        {/* Produtos */}
        <Section title="Produtos">
          <ListaItens itens={itens} onUpdatePreco={updatePreco} onUpdateQtd={updateQtd} onRemover={removerItem} />
          {itens.length > 0 && <Divider />}
          <BuscaProduto onSelect={adicionarProduto} />
        </Section>

        {/* Endereço de entrega */}
        <Section title="Endereço de entrega">
          <div>
            <Label required>CEP{cepLoading ? ' (buscando...)' : ''}</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => buscarCep(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
              required
            />
          </div>

          <div>
            <Label required>Logradouro</Label>
            <Input value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua / Av." required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Número</Label>
              <Input value={numEnd} onChange={(e) => setNumEnd(e.target.value)} placeholder="Nº" required />
            </div>
            <div>
              <Label>Complemento</Label>
              <Input value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco..." />
            </div>
          </div>

          <div>
            <Label required>Bairro</Label>
            <Input value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label required>Data de entrega</Label>
              <Input
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
                min={today}
                required
              />
            </div>
            <div>
              <Label>Horário</Label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
              >
                <option value="">—</option>
                {PERIODOS_ENTREGA.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <Divider />

          <div>
            <Label required>Frete (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={frete}
              onChange={(e) => setFrete(e.target.value)}
              required
            />
          </div>
        </Section>

        {/* Destinatário */}
        <Section title="Destinatário">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paraOutra}
              onChange={(e) => setParaOutra(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-700">Para outra pessoa</span>
          </label>

          {paraOutra && (
            <div className="space-y-3">
              <div>
                <Label required>Nome do destinatário</Label>
                <Input value={destNome} onChange={(e) => setDestNome(e.target.value)} placeholder="Nome completo" required={paraOutra} />
              </div>
              <div>
                <Label required>Telefone do destinatário</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={destTel}
                  onChange={(e) => setDestTel(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  required={paraOutra}
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={comMensagem}
              onChange={(e) => setComMensagem(e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <span className="text-sm text-gray-700">Com mensagem no cartão</span>
          </label>

          {comMensagem && (
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Mensagem do cartão..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
            />
          )}
        </Section>

        {/* Observações */}
        <Section title="Observações">
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            placeholder="Instruções especiais, referências de entrega..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
          />
        </Section>

        {/* Totais */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resumo</p>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Produtos</span>
            <span>{brl(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frete</span>
            <span>{brl(freteNum)}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-bold text-gray-900">{brl(total)}</span>
          </div>
        </div>

        {/* Pagamento */}
        <Section title="Pagamento">
          <div className="grid grid-cols-3 gap-2">
            {([['pix', 'PIX'], ['cartao', 'Cartão'], ['link_mp', 'Gerar link']] as const).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setPagamento(v)}
                className={`py-3 rounded-xl text-sm font-semibold transition-colors border ${
                  pagamento === v
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-orange-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {pagamento !== 'link_mp' ? (
            <p className="text-xs text-gray-500">Pedido criado como <strong>aprovado</strong>.</p>
          ) : (
            <p className="text-xs text-gray-500">Pedido criado como <strong>pendente</strong> — link para enviar ao cliente.</p>
          )}
        </Section>

        {erro && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{erro}</p>}

        <button
          type="submit"
          disabled={loading || itens.length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-colors"
        >
          {loading ? 'Criando pedido...' : 'Criar Pedido'}
        </button>

      </form>
    </div>
  )
}
