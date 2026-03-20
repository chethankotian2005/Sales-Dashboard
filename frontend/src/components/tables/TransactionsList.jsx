import { clsx } from 'clsx'
import {
  ShoppingBag,
  ArrowRightLeft,
  CreditCard,
  Utensils,
  Car,
  Music,
  Zap,
  Briefcase,
  RotateCcw,
  MoreHorizontal,
} from 'lucide-react'
import { useTransactions } from '../../api/hooks'
import { formatCurrency, formatDateTime } from '../../utils/format'
import { ListSkeleton } from '../ui/Skeleton'

const iconMap = {
  shopping: ShoppingBag,
  transfer: ArrowRightLeft,
  subscription: CreditCard,
  food: Utensils,
  transport: Car,
  entertainment: Music,
  utilities: Zap,
  salary: Briefcase,
  refund: RotateCcw,
  other: MoreHorizontal,
}

const iconColors = {
  shopping: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  transfer: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  subscription: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  food: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  transport: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  entertainment: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  utilities: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  salary: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  refund: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export default function TransactionsList() {
  const { data, isLoading, error } = useTransactions(1)

  if (isLoading) return <ListSkeleton items={5} />
  if (error) return <div className="card text-red-500">Error loading transactions</div>

  const transactions = data?.results || []

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <button className="text-sm text-primary-500 hover:text-primary-600 font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {transactions.slice(0, 6).map((transaction, index) => {
          const Icon = iconMap[transaction.icon] || iconMap.other
          const isIncome = transaction.transaction_type === 'income'

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 animate-slide-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={clsx('p-2.5 rounded-xl', iconColors[transaction.icon] || iconColors.other)}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {transaction.title}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(transaction.created_at)}
                </p>
              </div>

              <span
                className={clsx(
                  'font-semibold',
                  isIncome ? 'text-success' : 'text-danger'
                )}
              >
                {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
