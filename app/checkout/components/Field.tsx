export function inputCls(hasError?: boolean): string {
  const base =
    'w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 transition-colors'
  return hasError
    ? `${base} bg-rose-50 border-rose-400 focus:ring-rose-200 focus:border-rose-400`
    : `${base} bg-white border-gray-300 focus:ring-green-200 focus:border-[#1E7439]`
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-0.5">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
      {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
    </div>
  )
}
