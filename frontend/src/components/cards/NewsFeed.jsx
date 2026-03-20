import { useState } from 'react'
import { clsx } from 'clsx'
import { Calendar } from 'lucide-react'
import { useNews } from '../../api/hooks'
import { formatDate } from '../../utils/format'
import { ListSkeleton } from '../ui/Skeleton'

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'tomorrow', label: 'Upcoming' },
]

export default function NewsFeed() {
  const [filter, setFilter] = useState('today')
  const [page, setPage] = useState(1)
  const { data, isLoading, error, isFetching } = useNews(page, filter)

  if (isLoading) return <ListSkeleton items={3} />
  if (error) return <div className="card text-red-500">Error loading news</div>

  const news = data?.results || []
  const hasMore = !!data?.next

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          News & Updates
        </h3>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setFilter(tab.key)
                setPage(1)
              }}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === tab.key
                  ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {news.length > 0 ? (
          news.map((item, index) => (
            <div
              key={item.id}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h4 className="font-medium text-gray-900 dark:text-white">
                {item.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {item.snippet}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(item.published_at)}</span>
                {item.source && (
                  <>
                    <span className="mx-1">·</span>
                    <span>{item.source}</span>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No news for this period
          </div>
        )}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          disabled={isFetching}
          className="w-full mt-4 py-2 text-sm font-medium text-primary-500 hover:text-primary-600 disabled:opacity-50"
        >
          {isFetching ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  )
}
