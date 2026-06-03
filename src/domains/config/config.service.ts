import type { ConfigRepository } from './config.repository'
import { CONFIG_SCHEMA, CONFIG_DEFAULTS, type ConfigKey, type ConfigValue } from './config.types'

export class ConfigServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigServiceError'
  }
}

export function createConfigService(repository: ConfigRepository) {
  return {
    async get<K extends ConfigKey>(key: K): Promise<ConfigValue<K>> {
      const row = await repository.get(key)
      if (!row) return CONFIG_DEFAULTS[key]
      const result = CONFIG_SCHEMA[key].safeParse(row.value)
      return (result.success ? result.data : CONFIG_DEFAULTS[key]) as ConfigValue<K>
    },

    async set<K extends ConfigKey>(key: K, value: unknown): Promise<ConfigValue<K>> {
      const result = CONFIG_SCHEMA[key].safeParse(value)
      if (!result.success) {
        throw new ConfigServiceError((result.error as unknown as { errors: { message: string }[] }).errors[0]?.message ?? 'Valor inválido')
      }
      await repository.set(key, result.data)
      return result.data as ConfigValue<K>
    },

    async list(): Promise<{ [K in ConfigKey]: ConfigValue<K> }> {
      const rows = await repository.list()
      const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]))
      return Object.fromEntries(
        (Object.keys(CONFIG_DEFAULTS) as ConfigKey[]).map((key) => {
          const result = CONFIG_SCHEMA[key].safeParse(stored[key])
          return [key, result.success ? result.data : CONFIG_DEFAULTS[key]]
        }),
      ) as { [K in ConfigKey]: ConfigValue<K> }
    },
  }
}

export type ConfigService = ReturnType<typeof createConfigService>
