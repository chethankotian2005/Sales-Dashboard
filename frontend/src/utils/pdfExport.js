import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const COLORS = {
  primary: [67, 97, 238],
  dark: [31, 41, 55],
  gray: [107, 114, 128],
  lightGray: [229, 231, 235],
  white: [255, 255, 255],
}

export async function generateAnalyticsPDF({ kpis, topProducts, chartRefs }) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      pdf.addPage()
      yPos = margin
      return true
    }
    return false
  }

  // Helper function to capture element as image
  const captureElement = async (element) => {
    if (!element) return null
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error capturing element:', error)
      return null
    }
  }

  // ============ COVER SECTION ============
  // Background header
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(0, 0, pageWidth, 60, 'F')

  // Title
  pdf.setTextColor(...COLORS.white)
  pdf.setFontSize(28)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Sales Analytics Report', pageWidth / 2, 30, { align: 'center' })

  // Subtitle with date
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  pdf.text(`Report Period: Last 30 Days`, pageWidth / 2, 42, { align: 'center' })

  // Generated timestamp
  pdf.setFontSize(10)
  const timestamp = today.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  pdf.text(`Generated: ${timestamp}`, pageWidth / 2, 52, { align: 'center' })

  yPos = 75

  // ============ KPI SUMMARY TABLE ============
  pdf.setTextColor(...COLORS.dark)
  pdf.setFontSize(16)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Key Performance Indicators', margin, yPos)
  yPos += 10

  // Table header
  const colWidth = contentWidth / 4
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(margin, yPos, contentWidth, 10, 'F')

  pdf.setTextColor(...COLORS.white)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')

  const kpiLabels = ['Total Revenue', 'Conversion Rate', 'Avg Order Value', 'Return Rate']
  kpiLabels.forEach((label, i) => {
    pdf.text(label, margin + colWidth * i + colWidth / 2, yPos + 7, { align: 'center' })
  })
  yPos += 10

  // Table values row
  pdf.setFillColor(...COLORS.lightGray)
  pdf.rect(margin, yPos, contentWidth, 12, 'F')

  pdf.setTextColor(...COLORS.dark)
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')

  const kpiValues = [
    kpis?.total_revenue ? `$${kpis.total_revenue.toLocaleString()}` : '$0',
    kpis?.conversion_rate ? `${kpis.conversion_rate.toFixed(1)}%` : '0%',
    kpis?.avg_order_value ? `$${kpis.avg_order_value.toLocaleString()}` : '$0',
    kpis?.return_rate ? `${kpis.return_rate.toFixed(1)}%` : '0%',
  ]

  kpiValues.forEach((value, i) => {
    pdf.text(value, margin + colWidth * i + colWidth / 2, yPos + 8, { align: 'center' })
  })
  yPos += 20

  // ============ CHARTS ============
  // Revenue by Category Chart
  if (chartRefs.revenueByCategory) {
    checkPageBreak(90)
    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Revenue by Category', margin, yPos)
    yPos += 5

    const revenueCatImg = await captureElement(chartRefs.revenueByCategory)
    if (revenueCatImg) {
      const imgHeight = 70
      pdf.addImage(revenueCatImg, 'PNG', margin, yPos, contentWidth, imgHeight)
      yPos += imgHeight + 10
    }
  }

  // Sales Trend Chart
  if (chartRefs.salesTrend) {
    checkPageBreak(90)
    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Sales Trend', margin, yPos)
    yPos += 5

    const salesTrendImg = await captureElement(chartRefs.salesTrend)
    if (salesTrendImg) {
      const imgHeight = 70
      pdf.addImage(salesTrendImg, 'PNG', margin, yPos, contentWidth, imgHeight)
      yPos += imgHeight + 10
    }
  }

  // ============ TOP PRODUCTS TABLE ============
  checkPageBreak(80)
  pdf.setTextColor(...COLORS.dark)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Top 5 Products by Revenue', margin, yPos)
  yPos += 8

  // Table header
  pdf.setFillColor(...COLORS.primary)
  pdf.rect(margin, yPos, contentWidth, 8, 'F')

  pdf.setTextColor(...COLORS.white)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')

  const productColWidths = [10, contentWidth * 0.5, contentWidth * 0.25, contentWidth * 0.25 - 10]
  pdf.text('#', margin + 5, yPos + 5.5)
  pdf.text('Product Name', margin + 15, yPos + 5.5)
  pdf.text('Units Sold', margin + 15 + productColWidths[1], yPos + 5.5)
  pdf.text('Revenue', margin + 15 + productColWidths[1] + productColWidths[2], yPos + 5.5)
  yPos += 8

  // Table rows
  const products = (topProducts || []).slice(0, 5)
  products.forEach((product, index) => {
    const isEven = index % 2 === 0
    if (isEven) {
      pdf.setFillColor(249, 250, 251)
      pdf.rect(margin, yPos, contentWidth, 8, 'F')
    }

    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')

    pdf.text(`${index + 1}`, margin + 5, yPos + 5.5)
    pdf.text(product.name?.substring(0, 35) || 'N/A', margin + 15, yPos + 5.5)
    pdf.text(`${product.units_sold?.toLocaleString() || 0}`, margin + 15 + productColWidths[1], yPos + 5.5)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`$${product.revenue?.toLocaleString() || 0}`, margin + 15 + productColWidths[1] + productColWidths[2], yPos + 5.5)

    yPos += 8
  })

  // If no products
  if (products.length === 0) {
    pdf.setTextColor(...COLORS.gray)
    pdf.setFontSize(10)
    pdf.text('No product data available', pageWidth / 2, yPos + 10, { align: 'center' })
    yPos += 20
  }

  // ============ MORE CHARTS ============
  // Top Products Chart
  if (chartRefs.topProducts) {
    checkPageBreak(90)
    yPos += 10
    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Top Products Chart', margin, yPos)
    yPos += 5

    const topProductsImg = await captureElement(chartRefs.topProducts)
    if (topProductsImg) {
      const imgHeight = 70
      pdf.addImage(topProductsImg, 'PNG', margin, yPos, contentWidth, imgHeight)
      yPos += imgHeight + 10
    }
  }

  // Customer Acquisition Chart
  if (chartRefs.customerAcquisition) {
    checkPageBreak(90)
    pdf.setTextColor(...COLORS.dark)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Customer Acquisition', margin, yPos)
    yPos += 5

    const custAcqImg = await captureElement(chartRefs.customerAcquisition)
    if (custAcqImg) {
      const imgHeight = 70
      pdf.addImage(custAcqImg, 'PNG', margin, yPos, contentWidth, imgHeight)
      yPos += imgHeight + 10
    }
  }

  // ============ FOOTER ============
  const totalPages = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)

    // Footer line
    pdf.setDrawColor(...COLORS.lightGray)
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15)

    // Footer text
    pdf.setTextColor(...COLORS.gray)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.text('Generated by SalesDash', margin, pageHeight - 8)
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
  }

  // Save the PDF
  const filename = `SalesDash_Analytics_Report_${today.toISOString().split('T')[0]}.pdf`
  pdf.save(filename)

  return filename
}
