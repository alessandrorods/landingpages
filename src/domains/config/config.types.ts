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

export const deliveryRegionSchema = z.object({
  region: z.string().min(1),
  label: z.string().min(1),
  zipStart: z.string().regex(/^\d{8}$/, 'CEP início deve ter 8 dígitos'),
  zipEnd: z.string().regex(/^\d{8}$/, 'CEP fim deve ter 8 dígitos'),
})

export type DeliveryRegion = z.infer<typeof deliveryRegionSchema>

export const CONFIG_SCHEMA = {
  preparationTimeMinutes: z.number().int().min(0),
  deliveryPeriods: z.array(periodoEntregaSchema),
  deliveryRegions: z.array(deliveryRegionSchema),
} as const

export type ConfigKey = keyof typeof CONFIG_SCHEMA
export type ConfigValue<K extends ConfigKey> = z.infer<typeof CONFIG_SCHEMA[K]>

export const CONFIG_DEFAULTS: { [K in ConfigKey]: ConfigValue<K> } = {
  preparationTimeMinutes: 60,
  deliveryPeriods: [] as PeriodoEntrega[],
  deliveryRegions: [] as Array<DeliveryRegion>,
}

// Only numeric/simple keys — deliveryPeriods and deliveryRegions have dedicated editors
export const CONFIG_LABELS: Partial<Record<ConfigKey, string>> = {
  preparationTimeMinutes: 'Tempo mínimo de preparo (minutos)',
}
