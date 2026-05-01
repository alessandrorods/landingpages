'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCTS } from '@/constants/products'
import { cepAtendido } from '@/constants/cep'
import type { FormData, CepStatus, EnderecoForm, DestinatarioForm, CompradorForm } from './types'
import { STORAGE_KEY, EMPTY_FORM, maskCEP, fetchViaCEP } from './utils'
import { StepIndicator } from './components/StepIndicator'
import { StepEndereco } from './components/StepEndereco'
import { StepDestinatario } from './components/StepDestinatario'
import { StepComprador } from './components/StepComprador'
import { StepResumo } from './components/StepResumo'
import { CheckoutNav } from './components/CheckoutNav'
import { DeliveryPicker } from './components/DeliveryPicker'
import { CardMensagem } from './components/CardMensagem'

export default function CheckoutForm({ sku }: { sku: string }) {
  const product = PRODUCTS.find(p => p.sku === sku)
  const router = useRouter()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [cepStatus, setCepStatus] = useState<CepStatus>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const { form: savedForm, step: savedStep, sku: savedSku } = JSON.parse(raw) as {
          form: FormData
          step: number
          sku?: string
        }
        setForm(savedForm ?? EMPTY_FORM)
        setStep(savedSku === sku ? (savedStep ?? 0) : 0)
        if ((savedForm?.endereco?.cep ?? '').replace(/\D/g, '').length === 8) {
          setCepStatus('ok')
        }
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [sku])

  useEffect(() => {
    if (!ready) return
    try {
      const saved = cepStatus === 'ok' ? form : { ...form, endereco: { ...form.endereco, cep: '' } }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ form: saved, step, sku }))
    } catch {
      // ignore
    }
  }, [form, step, sku, ready, cepStatus])

  const handleCEP = useCallback(async (raw: string) => {
    const masked = maskCEP(raw)
    setForm(f => ({ ...f, endereco: { ...f.endereco, cep: masked } }))
    setErrors(prev => {
      if (!prev.cep) return prev
      const { cep: _, ...rest } = prev
      return rest
    })

    const digits = masked.replace(/\D/g, '')
    if (digits.length < 8) { setCepStatus('idle'); return }
    if (!cepAtendido(digits)) { setCepStatus('fora-area'); return }

    setCepStatus('loading')
    const data = await fetchViaCEP(digits)
    if (!data) { setCepStatus('invalido'); return }

    setCepStatus('ok')
    setForm(f => ({
      ...f,
      endereco: {
        ...f.endereco,
        logradouro: data.logradouro || f.endereco.logradouro,
        bairro: data.bairro || f.endereco.bairro,
      },
    }))
  }, [])

  function validate(s: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (s === 0) {
      if (cepStatus === 'fora-area') e.cep = 'Região não atendida. Atendemos apenas em Mogi das Cruzes / SP.'
      else if (cepStatus !== 'ok') e.cep = 'Informe um CEP válido de Mogi das Cruzes'
      if (!form.endereco.logradouro.trim()) e.logradouro = 'Informe o endereço'
      if (!form.endereco.numero.trim()) e.numero = 'Informe o número'
      if (!form.endereco.bairro.trim()) e.bairro = 'Informe o bairro'
      if (!form.endereco.dataEntrega) e.dataEntrega = 'Selecione uma data de entrega'
      if (!form.endereco.periodoEntrega) e.periodoEntrega = 'Selecione um período de entrega'
    }
    if (s === 1 && form.destinatario.paraOutraPessoa) {
      if (!form.destinatario.nome.trim()) e.destNome = 'Informe o nome de quem recebe'
      if (form.destinatario.telefone.replace(/\D/g, '').length < 10) e.destTelefone = 'Informe um telefone válido'
    }
    if (s === 2) {
      if (!form.comprador.nome.trim()) e.comprNome = 'Informe seu nome'
      if (form.comprador.telefone.replace(/\D/g, '').length < 10) e.comprTelefone = 'Informe um telefone válido'
    }
    return e
  }

  function goNext() {
    const e = validate(step)
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setStep(s => s + 1)
  }

  function goBack() {
    setErrors({})
    setStep(s => s - 1)
  }

  async function handleSubmit() {
    if (!product) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, endereco: form.endereco, destinatario: form.destinatario, comprador: form.comprador }),
      })
      const data = (await res.json()) as { id?: number; numero?: string; error?: string }
      if (!res.ok) { setSubmitError(data.error ?? 'Erro ao criar pedido. Tente novamente.'); return }
      const orderId = data.numero ?? data.id ?? `ORD-${Date.now()}`
      const params = new URLSearchParams({ pedido: String(orderId), sku, valor: String(product.price), nome: form.comprador.nome })
      try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
      router.push(`/dia-das-maes/confirmacao?${params.toString()}`)
    } catch {
      setSubmitError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const setEnd = (k: keyof EnderecoForm, v: string) =>
    setForm(f => ({ ...f, endereco: { ...f.endereco, [k]: v } }))
  const setDest = (k: keyof DestinatarioForm, v: string) =>
    setForm(f => ({ ...f, destinatario: { ...f.destinatario, [k]: v } }))
  const toggleParaOutraPessoa = (v: boolean) =>
    setForm(f => ({ ...f, destinatario: { ...f.destinatario, paraOutraPessoa: v } }))
  const toggleComMensagem = (v: boolean) =>
    setForm(f => ({ ...f, destinatario: { ...f.destinatario, comMensagem: v, mensagemCartao: v ? f.destinatario.mensagemCartao : '' } }))
  const setComp = (k: keyof CompradorForm, v: string) =>
    setForm(f => ({ ...f, comprador: { ...f.comprador, [k]: v } }))

  const cepDisplayError: string | undefined =
    errors.cep ??
    (cepStatus === 'fora-area' ? 'Região não atendida. Atendemos apenas em Mogi das Cruzes / SP.'
      : cepStatus === 'invalido' ? 'CEP não encontrado. Verifique e tente novamente.'
      : undefined)

  if (!ready) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-8 pb-16 text-gray-900">
      <StepIndicator current={step} onNavigate={i => { setErrors({}); setStep(i) }} />

      {step < 3 && (
        <div className="bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 p-6 mt-6">
          {step === 0 && (
            <StepEndereco
              endereco={form.endereco}
              cepStatus={cepStatus}
              cepDisplayError={cepDisplayError}
              errors={errors}
              onCEP={handleCEP}
              onChange={setEnd}
            />
          )}
          {step === 1 && (
            <StepDestinatario destinatario={form.destinatario} errors={errors} onChange={setDest} onToggle={toggleParaOutraPessoa} />
          )}
          {step === 2 && (
            <StepComprador comprador={form.comprador} errors={errors} onChange={setComp} />
          )}
        </div>
      )}

      {step === 3 && (
        <StepResumo form={form} product={product} onNavigate={i => { setErrors({}); setStep(i) }} />
      )}

      {step === 1 && (
        <div className="bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
          <CardMensagem
            comMensagem={form.destinatario.comMensagem}
            mensagemCartao={form.destinatario.mensagemCartao}
            onToggle={toggleComMensagem}
            onChange={v => setDest('mensagemCartao', v)}
          />
        </div>
      )}

      {step === 0 && cepStatus === 'ok' && (
        <div className="bg-white text-gray-900 rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
          <h2 className="text-base font-bold text-gray-800 mb-4">Data e período de entrega</h2>
          <DeliveryPicker
            dataEntrega={form.endereco.dataEntrega}
            periodoEntrega={form.endereco.periodoEntrega}
            onData={v => setEnd('dataEntrega', v)}
            onPeriodo={v => setEnd('periodoEntrega', v)}
            errorData={errors.dataEntrega}
            errorPeriodo={errors.periodoEntrega}
          />
        </div>
      )}

      <CheckoutNav
        step={step}
        cepStatus={cepStatus}
        submitting={submitting}
        hasProduct={!!product}
        submitError={submitError}
        onNext={goNext}
        onBack={goBack}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
