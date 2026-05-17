import { ReactNode } from 'react'

interface CardProps {
  title: string
  value: string | number
  icon?: ReactNode
}

export default function Card({ title, value, icon }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-soft border border-border-subtle dark:border-white/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        {icon && <div className="text-gray-700 dark:text-gray-300">{icon}</div>}
      </div>
    </div>
  )
}
