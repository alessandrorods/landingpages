import { z } from 'zod'

export const CONFIG_SCHEMA = {
  preparationTimeMinutes: z.number().int().min(0),
} as const

export type ConfigKey = keyof typeof CONFIG_SCHEMA
export type ConfigValue<K extends ConfigKey> = z.infer<typeof CONFIG_SCHEMA[K]>

export const CONFIG_DEFAULTS: { [K in ConfigKey]: ConfigValue<K> } = {
  preparationTimeMinutes: 60,
}

export const CONFIG_LABELS: Record<ConfigKey, string> = {
  preparationTimeMinutes: 'Tempo mínimo de preparo (minutos)',
}
