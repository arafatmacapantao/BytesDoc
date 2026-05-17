'use client'

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; name: string; payload: { name: string } }>
  label?: string
}

export default function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  const value = payload[0].value
  return (
    <div className="rounded-md bg-[#1a1a1a] text-white text-xs px-3 py-2 shadow-elevated ring-1 ring-white/10">
      <p className="text-gray-400">{label}</p>
      <p className="font-semibold mt-0.5">{value.toLocaleString()}</p>
    </div>
  )
}
