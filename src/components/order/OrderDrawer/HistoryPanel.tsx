import { IoTimeOutline } from 'react-icons/io5'
import { ROLE_LABELS } from '@/domains/admin/auth'
import type { Role } from '@/domains/admin/auth'
import { ACTION_LABEL, ACTION_DOT, METADATA_LABEL, METADATA_VALUE } from '@/constants/orderDisplay'
import type { OrderHistoryEntryDTO } from '@/domains/orders/order.types'

function ActorDisplay({ actorType, actorName, actorRole }: {
  actorType: 'user' | 'system'
  actorName: string
  actorRole: string | null
}) {
  if (actorType === 'system') {
    return <span>{actorName}</span>
  }
  const roleLabel = actorRole ? (ROLE_LABELS[actorRole as Role] ?? actorRole) : null
  return (
    <>
      <span className="text-gray-600">{actorName}</span>
      {roleLabel && <span className="text-gray-400 ml-1">· {roleLabel}</span>}
    </>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export function HistoryPanel({ entries }: { entries: OrderHistoryEntryDTO[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <IoTimeOutline size={32} className="mb-2 opacity-40" />
        <p className="text-sm">Nenhuma ação registrada</p>
      </div>
    )
  }

  return (
    <div className="relative pl-5">
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-200" />
      <div className="space-y-5">
        {entries.map((entry) => (
          <div key={entry.id} className="relative flex gap-3">
            <div className={`absolute -left-5 mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${ACTION_DOT[entry.action] ?? 'bg-gray-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                {ACTION_LABEL[entry.action] ?? entry.action}
              </p>
              <div className="text-xs text-gray-400 mt-0.5 space-y-0.5">
                <div>{formatDate(entry.createdAt)}</div>
                <div>
                  <ActorDisplay
                    actorType={entry.actorType}
                    actorName={entry.actorName}
                    actorRole={entry.actorRole}
                  />
                </div>
              </div>
              {entry.metadata && Object.entries(entry.metadata).length > 0 && (
                <div className="mt-1 space-y-1.5">
                  {Object.entries(entry.metadata).map(([key, value]) => {
                    if (key === 'photoUrls' || key === 'lat' || key === 'lng') return null
                    if (Array.isArray(value) || typeof value === 'object') return null
                    const label = METADATA_LABEL[key] ?? key
                    const translated = METADATA_VALUE[key]?.[String(value)]
                    const display = translated ?? String(value)
                    if (!display) return null
                    return (
                      <p key={key} className="text-xs text-gray-500">
                        {translated !== undefined ? `${label} ${display}` : `${label}: ${display}`}
                      </p>
                    )
                  })}
                  {/* Map link */}
                  {typeof entry.metadata.lat === 'number' && typeof entry.metadata.lng === 'number' && (
                    <a
                      href={`https://maps.google.com/?q=${entry.metadata.lat},${entry.metadata.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      Ver localização no mapa
                    </a>
                  )}
                  {/* Photos */}
                  {Array.isArray(entry.metadata.photoUrls) && (entry.metadata.photoUrls as string[]).length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {(entry.metadata.photoUrls as string[]).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`Foto ${i + 1}`}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
