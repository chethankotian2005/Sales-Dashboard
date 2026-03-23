import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, RefreshCw } from 'lucide-react'
import { useGlobalSales, useKPIs, useTopProducts } from '../../api/hooks'
import api from '../../api/axios'

function formatTime(date) {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function parseInsightLines(text) {
  const sanitize = (line) => line
    .replace(/\*+/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .trim()

  const lines = text
    .split(/\r?\n/)
    .map((line) => sanitize(line))
    .filter(Boolean)

  const bulletLines = lines
    .filter((line) => line.startsWith('•') || line.startsWith('-'))
    .map((line) => sanitize(line.replace(/^[-•]\s*/, '')))

  if (bulletLines.length > 0) {
    return bulletLines
  }

  return lines.map((line) => sanitize(line.replace(/^[-•]\s*/, '')))
}

export default function AIInsightsCard() {
  const { data: kpis } = useKPIs()
  const { data: topProducts } = useTopProducts(10)
  const { data: globalSales } = useGlobalSales()

  const [insights, setInsights] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasFirstToken, setHasFirstToken] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  const controllerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  const kpiData = useMemo(() => ({
    revenue: kpis?.revenue ?? 0,
    totalOrders: kpis?.total_orders ?? 0,
    totalSalesUnits: kpis?.sales_units ?? 0,
    topProducts: (topProducts || []).slice(0, 3).map((p) => ({
      name: p.name,
      sold: p.sold ?? p.units_sold ?? 0,
    })),
    globalSales: (globalSales || []).slice(0, 4).map((g) => ({
      country: g.country,
      sales: g.sales ?? Number(g.total_revenue ?? 0),
    })),
    revenueChange: kpis?.revenue_change ?? 0,
  }), [globalSales, kpis, topProducts])

  const generateInsights = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    setError('')
    setInsights('')
    setHasFirstToken(false)
    setIsStreaming(true)

    const apiKey = import.meta.env.VITE_QWEN_API_KEY
    if (!apiKey) {
      setError('Failed to generate insights. Check your API key.')
      setIsStreaming(false)
      return
    }

    const controller = new AbortController()
    controllerRef.current = controller

    try {
      const isNvidiaKey = apiKey.startsWith('nvapi-')

      if (isNvidiaKey) {
        const { data } = await api.post('/dashboard/ai-insights/', {
          apiKey,
          kpiData,
        })
        const content = data?.content || ''
        setHasFirstToken(true)
        setInsights(content)
        setLastUpdated(new Date())
        return
      }

      const endpoint = isNvidiaKey
        ? 'https://integrate.api.nvidia.com/v1/chat/completions'
        : 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
      const model = isNvidiaKey ? 'qwen/qwen3.5-122b-a10b' : 'qwen-plus'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(isNvidiaKey ? { Accept: 'text/event-stream' } : {}),
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            {
              role: 'system',
              content: 'You are a concise sales analyst. Respond only in bullet points. Never exceed 120 words.',
            },
            {
              role: 'user',
              content: `Analyze this sales data and give exactly 3 bullet-point insights about trends/anomalies, then 1 actionable recommendation:\n\n${JSON.stringify(kpiData, null, 2)}`,
            },
          ],
        }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Bad API response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith('data: ')) continue

          const payload = line.slice(6)
          if (payload === '[DONE]') {
            continue
          }

          try {
            const parsed = JSON.parse(payload)
            const delta = parsed?.choices?.[0]?.delta?.content || ''
            if (delta) {
              setHasFirstToken(true)
              setInsights((prev) => prev + delta)
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      }

      setLastUpdated(new Date())
    } catch {
      setError('Failed to generate insights. Check your API key.')
    } finally {
      setIsStreaming(false)
      controllerRef.current = null
    }
  }

  const lines = parseInsightLines(insights)

  return (
    <div
      className="card"
      style={{
        border: '2px solid transparent',
        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #60a5fa, #4361ee) border-box',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-600" />
          AI Insights
        </h3>
        {lastUpdated && !isStreaming && (
          <p className="text-xs text-gray-500">Last updated: {formatTime(lastUpdated)}</p>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          Failed to generate insights. Check your API key.
        </div>
      )}

      {isStreaming && !hasFirstToken && (
        <div className="space-y-3 mb-4">
          <div className="h-4 w-full rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-gray-200 animate-pulse" />
          <div className="h-4 w-4/6 rounded bg-gray-200 animate-pulse" />
        </div>
      )}

      {(insights || (isStreaming && hasFirstToken)) && (
        <div className="mb-4">
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            {lines.map((line, idx) => (
              <li key={`${line}-${idx}`}>{line}</li>
            ))}
            {isStreaming && (
              <li className="list-none ml-[-1.1rem]">
                <span className="inline-block w-2 h-4 align-middle bg-gray-800 animate-blink" />
              </li>
            )}
          </ul>
        </div>
      )}

      {!insights && !isStreaming && (
        <button
          onClick={generateInsights}
          className="btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 inline-flex items-center gap-2"
        >
          <Bot className="w-4 h-4" />
          Generate Insights
        </button>
      )}

      {insights && !isStreaming && (
        <button
          onClick={generateInsights}
          className="btn bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </button>
      )}
    </div>
  )
}
