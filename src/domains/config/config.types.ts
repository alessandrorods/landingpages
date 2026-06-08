import { z } from 'zod'
import type { PeriodoEntrega } from '@/constants/pedido.types'

const periodoEntregaSchema = z.object({
  id: z.string(),
  label: z.string(),
  olistFormaFrete: z.string(),
  olistFormaFreteId: z.string(),
  sortOrder: z.number().int().min(0),
  deliveryLimitHour: z.string().regex(/^\d{2}:\d{2}$/),
})

const zipRangeSchema = z.object({
  zipStart: z.string().regex(/^\d{8}$/, 'CEP início deve ter 8 dígitos'),
  zipEnd:   z.string().regex(/^\d{8}$/, 'CEP fim deve ter 8 dígitos'),
})

export type ZipRange = z.infer<typeof zipRangeSchema>

export const deliveryRegionSchema = z.object({
  region:    z.string().min(1),
  label:     z.string().min(1),
  zipRanges: z.array(zipRangeSchema).min(1).optional(),
  // legacy flat fields — tolerated on read, synthesised into zipRanges
  zipStart: z.string().regex(/^\d{8}$/).optional(),
  zipEnd:   z.string().regex(/^\d{8}$/).optional(),
}).transform((v) => {
  const { zipStart, zipEnd, zipRanges, ...rest } = v
  const ranges = zipRanges?.length
    ? zipRanges
    : zipStart && zipEnd
      ? [{ zipStart, zipEnd }]
      : []
  return { ...rest, zipRanges: ranges }
})

export type DeliveryRegion = z.infer<typeof deliveryRegionSchema>

export const CONFIG_SCHEMA = {
  preparationTimeMinutes: z.number().int().min(0),
  deliveryPeriods: z.array(periodoEntregaSchema),
  deliveryRegions: z.array(deliveryRegionSchema),
  undeliveredReasons: z.array(z.string().min(1)),
  liWebhookSecret: z.string(),
  liWebhookUrl: z.string(),
  liEnvioMapping: z.record(z.string(), z.string()),  // liEnvioId → deliveryPeriodId
} as const

export type ConfigKey = keyof typeof CONFIG_SCHEMA
export type ConfigValue<K extends ConfigKey> = z.infer<typeof CONFIG_SCHEMA[K]>

export const CONFIG_DEFAULTS: { [K in ConfigKey]: ConfigValue<K> } = {
  preparationTimeMinutes: 60,
  deliveryPeriods: [] as PeriodoEntrega[],
  deliveryRegions: [] as Array<DeliveryRegion>,
  undeliveredReasons: [
    'Destinatário ausente',
    'Endereço não encontrado / incorreto',
    'Acesso bloqueado (portaria, condomínio)',
    'Recusa de recebimento',
    'Outro',
  ],
  liWebhookSecret: '',
  liWebhookUrl: '',
  liEnvioMapping: {},
}

// Only numeric/simple keys — deliveryPeriods and deliveryRegions have dedicated editors
export const CONFIG_LABELS: Partial<Record<ConfigKey, string>> = {
  preparationTimeMinutes: 'Tempo mínimo de preparo (minutos)',
}
