/**
 * Simple Linear Regression using Least Squares Method
 * No external ML libraries - implemented manually
 */

/**
 * Calculate the mean of an array of numbers
 */
function mean(values) {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

/**
 * Perform linear regression using least squares method
 * Returns slope (m) and intercept (b) for y = mx + b
 */
export function linearRegression(xValues, yValues) {
  const n = xValues.length
  if (n === 0 || n !== yValues.length) {
    return { slope: 0, intercept: 0 }
  }

  const xMean = mean(xValues)
  const yMean = mean(yValues)

  // Calculate slope: m = Σ((xi - x̄)(yi - ȳ)) / Σ((xi - x̄)²)
  let numerator = 0
  let denominator = 0

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean
    const yDiff = yValues[i] - yMean
    numerator += xDiff * yDiff
    denominator += xDiff * xDiff
  }

  // Avoid division by zero
  const slope = denominator !== 0 ? numerator / denominator : 0

  // Calculate intercept: b = ȳ - m * x̄
  const intercept = yMean - slope * xMean

  return { slope, intercept }
}

/**
 * Predict a value using linear regression parameters
 */
export function predict(x, slope, intercept) {
  return slope * x + intercept
}

/**
 * Generate sales forecast from historical data
 * @param {Array} historicalData - Array of { date, revenue } objects
 * @param {number} forecastDays - Number of days to forecast (default 30)
 * @param {number} confidencePercent - Confidence band percentage (default 15)
 * @returns {Object} { historical, forecast, projectedRevenue, regressionParams }
 */
export function generateSalesForecast(historicalData, forecastDays = 30, confidencePercent = 15) {
  if (!historicalData || historicalData.length < 2) {
    return {
      historical: [],
      forecast: [],
      projectedRevenue: 0,
      regressionParams: { slope: 0, intercept: 0 },
    }
  }

  // Prepare data for regression
  // Use index as x value (day number) for simplicity
  const xValues = historicalData.map((_, index) => index)
  const yValues = historicalData.map((d) => d.revenue || d.total || d.sales || 0)

  // Calculate linear regression
  const { slope, intercept } = linearRegression(xValues, yValues)

  // Format historical data with type marker
  const historical = historicalData.map((d, index) => ({
    date: d.date || d.day || `Day ${index + 1}`,
    actual: d.revenue || d.total || d.sales || 0,
    dayIndex: index,
    type: 'historical',
  }))

  // Generate forecast for next N days
  const lastIndex = historicalData.length - 1
  const lastDateStr = historicalData[lastIndex]?.date || historicalData[lastIndex]?.day
  const forecast = []
  let totalProjectedRevenue = 0

  for (let i = 1; i <= forecastDays; i++) {
    const dayIndex = lastIndex + i
    const predictedValue = Math.max(0, predict(dayIndex, slope, intercept))
    const confidenceBand = predictedValue * (confidencePercent / 100)

    // Generate forecast date label
    let forecastDate = `Day ${dayIndex + 1}`

    if (lastDateStr) {
      try {
        const baseDate = new Date(lastDateStr)
        // Check if date is valid
        if (!isNaN(baseDate.getTime())) {
          baseDate.setDate(baseDate.getDate() + i)
          forecastDate = baseDate.toISOString().split('T')[0]
        }
      } catch (e) {
        // Keep default forecastDate
      }
    }

    forecast.push({
      date: forecastDate,
      forecast: Math.round(predictedValue * 100) / 100,
      forecastUpper: Math.round((predictedValue + confidenceBand) * 100) / 100,
      forecastLower: Math.round((predictedValue - confidenceBand) * 100) / 100,
      dayIndex,
      type: 'forecast',
    })

    totalProjectedRevenue += predictedValue
  }

  return {
    historical,
    forecast,
    projectedRevenue: Math.round(totalProjectedRevenue * 100) / 100,
    regressionParams: { slope, intercept },
  }
}

/**
 * Combine historical and forecast data for chart display
 * This creates a seamless transition between historical and forecast
 */
export function combineDataForChart(historical, forecast) {
  // Add the last historical point to forecast for continuous line
  const combined = []

  // Add all historical data points
  historical.forEach((point) => {
    combined.push({
      date: point.date,
      actual: point.actual,
      forecast: null,
      forecastUpper: null,
      forecastLower: null,
      type: 'historical',
    })
  })

  // Add bridge point (last historical + first forecast connection)
  if (historical.length > 0 && forecast.length > 0) {
    const lastHistorical = historical[historical.length - 1]
    combined[combined.length - 1] = {
      ...combined[combined.length - 1],
      forecast: lastHistorical.actual,
      forecastUpper: lastHistorical.actual,
      forecastLower: lastHistorical.actual,
    }
  }

  // Add all forecast data points
  forecast.forEach((point) => {
    combined.push({
      date: point.date,
      actual: null,
      forecast: point.forecast,
      forecastUpper: point.forecastUpper,
      forecastLower: point.forecastLower,
      type: 'forecast',
    })
  })

  return combined
}

/**
 * Format date for display in chart
 */
export function formatDateForChart(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch (e) {
    return dateStr
  }
}
