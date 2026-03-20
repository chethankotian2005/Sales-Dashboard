import { useState, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from 'react-simple-maps'
import { Tooltip } from 'react-tooltip'
import { useGlobalSales } from '../../api/hooks'
import { formatCurrency } from '../../utils/format'
import { ChartSkeleton } from '../ui/Skeleton'

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Country coordinates for markers
const countryCoordinates = {
  USA: [-95.7129, 37.0902],
  GBR: [-3.4360, 55.3781],
  DEU: [10.4515, 51.1657],
  AUS: [133.7751, -25.2744],
  BRA: [-51.9253, -14.2350],
  IND: [78.9629, 20.5937],
  JPN: [138.2529, 36.2048],
  CAN: [-106.3468, 56.1304],
  FRA: [2.2137, 46.2276],
}

// ISO numeric codes for countries
const countryIsoCodes = {
  USA: '840',
  GBR: '826',
  DEU: '276',
  AUS: '036',
  BRA: '076',
  IND: '356',
  JPN: '392',
  CAN: '124',
  FRA: '250',
}

// Reverse mapping from ISO code to country code
const isoToCountryCode = Object.entries(countryIsoCodes).reduce((acc, [code, iso]) => {
  acc[iso] = code
  return acc
}, {})

export default function WorldMapChart() {
  const { data, isLoading, error } = useGlobalSales()
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [hoveredCountry, setHoveredCountry] = useState(null)

  const salesData = useMemo(() => {
    return (data || []).reduce((acc, item) => {
      acc[item.country_code] = item
      return acc
    }, {})
  }, [data])

  const maxRevenue = useMemo(() => {
    return Math.max(...(data || []).map(item => parseFloat(item.total_revenue)), 1)
  }, [data])

  // Create highlighted countries map with ISO codes
  const highlightedCountries = useMemo(() => {
    const highlighted = {}
    Object.entries(countryIsoCodes).forEach(([countryCode, isoCode]) => {
      if (salesData[countryCode]) {
        highlighted[isoCode] = parseFloat(salesData[countryCode].total_revenue)
      }
    })
    return highlighted
  }, [salesData])

  if (isLoading) return <ChartSkeleton height="h-96" />
  if (error) return <div className="card text-red-500">Error loading global sales</div>

  const getCountryColor = (salesValue) => {
    if (!salesValue) return '#e2e8f0'
    const intensity = salesValue / maxRevenue
    // Blue gradient from light to dark
    const r = Math.round(219 - intensity * 150)
    const g = Math.round(234 - intensity * 140)
    const b = Math.round(254 - intensity * 16)
    return `rgb(${r},${g},${b})`
  }

  const getMarkerSize = (countryCode) => {
    const countryData = salesData[countryCode]
    if (!countryData) return 0
    const intensity = parseFloat(countryData.total_revenue) / maxRevenue
    return Math.sqrt(intensity) * 20
  }

  const activeCountry = hoveredCountry || selectedCountry
  const activeData = activeCountry ? salesData[activeCountry] : null

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Global Sales Distribution
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click on countries or markers to view details
          </p>
        </div>
        {selectedCountry && (
          <button
            onClick={() => setSelectedCountry(null)}
            className="text-sm text-primary-500 hover:text-primary-600 font-medium px-3 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20"
          >
            Clear Selection
          </button>
        )}
      </div>

      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{ height: '420px', background: 'linear-gradient(to bottom, #eff6ff, #dbeafe)' }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130, center: [0, 20] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={5}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const numericCode = geo.id
                  const salesValue = highlightedCountries[numericCode]
                  const countryCode = isoToCountryCode[numericCode]
                  const isActive = countryCode === activeCountry
                  const isSelected = countryCode === selectedCountry

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isActive ? '#4361ee' : getCountryColor(salesValue)}
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 1.5 : 0.5}
                      data-tooltip-id="map-tooltip"
                      data-tooltip-content={
                        salesValue
                          ? `${geo.properties.name}: ${formatCurrency(salesValue)}`
                          : geo.properties.name
                      }
                      onClick={() => {
                        if (salesValue && countryCode) {
                          setSelectedCountry(selectedCountry === countryCode ? null : countryCode)
                        }
                      }}
                      onMouseEnter={() => {
                        if (countryCode && salesData[countryCode]) {
                          setHoveredCountry(countryCode)
                        }
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                      style={{
                        default: {
                          outline: 'none',
                          cursor: salesValue ? 'pointer' : 'default',
                          transition: 'all 0.2s ease',
                        },
                        hover: {
                          fill: salesValue ? '#4361ee' : '#cbd5e1',
                          outline: 'none',
                        },
                        pressed: {
                          fill: '#3730a3',
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Markers for countries with sales data */}
            {Object.entries(countryCoordinates).map(([countryCode, coordinates]) => {
              const countryData = salesData[countryCode]
              if (!countryData) return null

              const size = getMarkerSize(countryCode)
              const isActive = countryCode === activeCountry
              const isSelected = countryCode === selectedCountry

              return (
                <Marker key={countryCode} coordinates={coordinates}>
                  {/* Outer pulse ring */}
                  <circle
                    r={size + 4}
                    fill="none"
                    stroke="#4361ee"
                    strokeWidth={1.5}
                    opacity={isActive ? 0.8 : 0.3}
                    className={isActive ? '' : 'animate-ping'}
                    style={{ animationDuration: '3s' }}
                  />
                  {/* Main marker */}
                  <circle
                    r={size}
                    fill={isSelected ? '#3730a3' : '#4361ee'}
                    fillOpacity={0.8}
                    stroke="#ffffff"
                    strokeWidth={isActive ? 3 : 2}
                    data-tooltip-id="map-tooltip"
                    data-tooltip-content={`${countryData.country}: ${formatCurrency(parseFloat(countryData.total_revenue))}`}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    }}
                    onClick={() => setSelectedCountry(selectedCountry === countryCode ? null : countryCode)}
                    onMouseEnter={() => setHoveredCountry(countryCode)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                  {/* Center dot */}
                  <circle r={3} fill="#ffffff" style={{ pointerEvents: 'none' }} />
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>

        <Tooltip
          id="map-tooltip"
          style={{
            backgroundColor: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
            padding: '8px 12px',
            fontSize: '13px',
            fontWeight: '500',
            zIndex: 1000,
          }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 rounded-xl p-3 shadow-lg text-xs backdrop-blur-sm">
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Sales Volume</p>
          <div className="flex items-center gap-1">
            <div
              style={{
                width: 80,
                height: 10,
                background: 'linear-gradient(to right, #dbeafe, #4361ee)',
                borderRadius: 4
              }}
            />
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Selected country detail panel */}
        {activeData && (
          <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-xl p-4 min-w-[220px] backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-3xl">{activeData.flag_emoji}</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">
                  {activeData.country}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activeData.country_code}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Revenue</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(parseFloat(activeData.total_revenue))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Orders</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {activeData.total_orders.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Market Share</span>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {parseFloat(activeData.percentage).toFixed(1)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 pt-2">
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(parseFloat(activeData.percentage) * 2.5, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Country stats below map */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-5">
        {(data || []).slice(0, 5).map((country) => {
          const isSelected = selectedCountry === country.country_code
          const isHovered = hoveredCountry === country.country_code

          return (
            <button
              key={country.country_code}
              onClick={() => setSelectedCountry(isSelected ? null : country.country_code)}
              onMouseEnter={() => setHoveredCountry(country.country_code)}
              onMouseLeave={() => setHoveredCountry(null)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 shadow-md'
                  : isHovered
                  ? 'bg-blue-50 dark:bg-gray-700 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-2xl">{country.flag_emoji}</span>
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {country.country}
                </p>
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(parseFloat(country.total_revenue), true)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
