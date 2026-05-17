export default function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
