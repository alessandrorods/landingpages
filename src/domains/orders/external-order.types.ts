export type ExternalPlatform = 'ifood' | 'giuliana_flores' | 'outro'

export const EXTERNAL_PLATFORMS: ExternalPlatform[] = ['ifood', 'giuliana_flores', 'outro']

export interface CreateExternalDispatchOrderInput {
  platform: ExternalPlatform
  externalNumber: string
  zipCode?: string
  neighborhood?: string
  deliveryDate: string    // DD/MM/YYYY
  deliveryPeriod?: string
  scheduledTime: string   // HH:MM
}

export interface ExternalDispatchOrderDTO {
  id: number
  platform: ExternalPlatform
  externalNumber: string
  zipCode: string | null
  neighborhood: string | null
  deliveryDate: string    // DD/MM/YYYY
  deliveryPeriod: string | null
  createdAt: string       // ISO
}
