import React, { useState, useEffect } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  FileText
} from 'lucide-react'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const Reports = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7days')
  const [reportData, setReportData] = useState({
    salesSummary: {
      totalSales: 0,
      totalProfit: 0,
      totalTransactions: 0,
      averageTransaction: 0
    },
    dailySales: [],
    productSales: [],
    paymentMethods: [],
    profitTrend: []
  })

  const [chartType, setChartType] = useState('bar') // bar, line, pie

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30days':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90days':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
        default:
          startDate.setDate(endDate.getDate() - 7)
      }

      // Fetch sales data
      const salesResponse = await axios.get('/api/sales', {
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          limit: 1000
        }
      })

      const sales = salesResponse.data.sales || []
      
      // Process data for reports
      const processedData = processSalesData(sales, startDate, endDate)
      setReportData(processedData)

    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processSalesData = (sales, startDate, endDate) => {
    // Sales Summary
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0)
    const totalProfit = sales.reduce((sum, sale) => sum + parseFloat(sale.profit), 0)
    const totalTransactions = sales.length
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    // Daily Sales (for chart)
    const dailySalesMap = new Map()
    const currentDate = new Date(startDate)
    
    // Initialize all dates with 0
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0]
      dailySalesMap.set(dateKey, { sales: 0, profit: 0, transactions: 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Fill in actual data
    sales.forEach(sale => {
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0]
      if (dailySalesMap.has(saleDate)) {
        const dayData = dailySalesMap.get(saleDate)
        dayData.sales += parseFloat(sale.totalAmount)
        dayData.profit += parseFloat(sale.profit)
        dayData.transactions += 1
      }
    })

    const dailySales = Array.from(dailySalesMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }))

    // Product Sales Analysis
    const productSalesMap = new Map()
    sales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const productName = item.product?.name || 'Unknown Product'
          if (!productSalesMap.has(productName)) {
            productSalesMap.set(productName, {
              name: productName,
              quantity: 0,
              revenue: 0,
              profit: 0
            })
          }
          const productData = productSalesMap.get(productName)
          productData.quantity += item.quantity
          productData.revenue += parseFloat(item.totalPrice)
          productData.profit += parseFloat(item.profit)
        })
      }
    })

    const productSales = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10) // Top 10 products

    // Payment Methods Analysis
    const paymentMethodsMap = new Map()
    sales.forEach(sale => {
      const method = sale.paymentMethod
      if (!paymentMethodsMap.has(method)) {
        paymentMethodsMap.set(method, { method, count: 0, amount: 0 })
      }
      const methodData = paymentMethodsMap.get(method)
      methodData.count += 1
      methodData.amount += parseFloat(sale.totalAmount)
    })

    const paymentMethods = Array.from(paymentMethodsMap.values())

    return {
      salesSummary: {
        totalSales,
        totalProfit,
        totalTransactions,
        averageTransaction
      },
      dailySales,
      productSales,
      paymentMethods,
      profitTrend: dailySales.map(day => ({
        date: day.date,
        profit: day.profit
      }))
    }
  }

  const getChartData = () => {
    const colors = [
      '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
      '#f97316', '#06b6d4', '#84cc16', '#ec4899', '#6366f1'
    ]

    switch (chartType) {
      case 'line':
        return {
          labels: reportData.dailySales.map(day => 
            new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ),
          datasets: [
            {
              label: 'Daily Sales (KSh)',
              data: reportData.dailySales.map(day => day.sales),
              borderColor: colors[0],
              backgroundColor: colors[0] + '20',
              tension: 0.1,
              fill: true
            },
            {
              label: 'Daily Profit (KSh)',
              data: reportData.dailySales.map(day => day.profit),
              borderColor: colors[2],
              backgroundColor: colors[2] + '20',
              tension: 0.1,
              fill: true
            }
          ]
        }

      case 'pie':
        return {
          labels: reportData.productSales.slice(0, 6).map(product => product.name),
          datasets: [
            {
              label: 'Revenue (KSh)',
              data: reportData.productSales.slice(0, 6).map(product => product.revenue),
              backgroundColor: colors.slice(0, 6),
              borderWidth: 2,
              borderColor: '#ffffff'
            }
          ]
        }

      default: // bar
        return {
          labels: reportData.productSales.slice(0, 8).map(product => product.name),
          datasets: [
            {
              label: 'Revenue (KSh)',
              data: reportData.productSales.slice(0, 8).map(product => product.revenue),
              backgroundColor: colors[0],
              borderColor: colors[0],
              borderWidth: 1
            },
            {
              label: 'Profit (KSh)',
              data: reportData.productSales.slice(0, 8).map(product => product.profit),
              backgroundColor: colors[2],
              borderColor: colors[2],
              borderWidth: 1
            }
          ]
        }
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: chartType === 'line' ? 'Sales Trend' : 
              chartType === 'pie' ? 'Top Products by Revenue' : 
              'Product Performance'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = typeof context.parsed === 'number' ? context.parsed : context.parsed.y
            return `${context.dataset.label}: KSh ${value.toLocaleString()}`
          }
        }
      }
    },
    scales: chartType !== 'pie' ? {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'KSh ' + value.toLocaleString()
          }
        }
      }
    } : {}
  }

  const exportData = () => {
    // Simple CSV export
    const csvData = [
      ['Date', 'Sales', 'Profit', 'Transactions'],
      ...reportData.dailySales.map(day => [
        day.date,
        day.sales,
        day.profit,
        day.transactions
      ])
    ]

    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `waemma-sales-report-${dateRange}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('Waemma Wines & Spirits Ltd', 20, 20)
    doc.setFontSize(16)
    doc.text('Sales Report', 20, 30)
    doc.setFontSize(12)
    doc.text(`Period: ${dateRange}`, 20, 40)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 50)
    
    // Summary
    doc.setFontSize(14)
    doc.text('Summary', 20, 70)
    doc.setFontSize(10)
    doc.text(`Total Sales: KSh ${reportData.salesSummary.totalSales.toLocaleString()}`, 20, 80)
    doc.text(`Total Profit: KSh ${reportData.salesSummary.totalProfit.toLocaleString()}`, 20, 90)
    doc.text(`Total Transactions: ${reportData.salesSummary.totalTransactions}`, 20, 100)
    doc.text(`Average Transaction: KSh ${reportData.salesSummary.averageTransaction.toLocaleString()}`, 20, 110)
    
    // Daily Sales Table
    const tableData = reportData.dailySales.slice().reverse().slice(0, 15).map(day => [
      new Date(day.date).toLocaleDateString(),
      `KSh ${day.sales.toLocaleString()}`,
      `KSh ${day.profit.toLocaleString()}`,
      day.transactions.toString(),
      `KSh ${day.transactions > 0 ? (day.sales / day.transactions).toLocaleString() : '0'}`
    ])
    
    doc.autoTable({
      head: [['Date', 'Sales', 'Profit', 'Transactions', 'Avg. Transaction']],
      body: tableData,
      startY: 125,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    })
    
    // Top Products
    if (reportData.productSales.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 125
      doc.setFontSize(14)
      doc.text('Top Products', 20, finalY + 20)
      
      const productData = reportData.productSales.slice(0, 10).map((product, index) => [
        (index + 1).toString(),
        product.name,
        product.quantity.toString(),
        `KSh ${product.revenue.toLocaleString()}`,
        `KSh ${product.profit.toLocaleString()}`
      ])
      
      doc.autoTable({
        head: [['#', 'Product', 'Quantity', 'Revenue', 'Profit']],
        body: productData,
        startY: finalY + 30,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }
      })
    }
    
    doc.save(`waemma-sales-report-${dateRange}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-waemma-primary"></div>
      </div>
    )
  }

  const renderChart = () => {
    const data = getChartData()
    
    switch (chartType) {
      case 'line':
        return <Line data={data} options={chartOptions} />
      case 'pie':
        return <Pie data={data} options={chartOptions} />
      default:
        return <Bar data={data} options={chartOptions} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Business performance insights and trends</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportData}
            className="bg-waemma-secondary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-secondary/90"
          >
            <Download className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportPDF}
            className="bg-red-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-red-700"
          >
            <FileText className="h-5 w-5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={fetchReportData}
            className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-gray-700"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Chart Type:</span>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded ${chartType === 'bar' ? 'bg-waemma-primary text-white' : 'bg-gray-200 text-gray-600'}`}
              title="Bar Chart"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded ${chartType === 'line' ? 'bg-waemma-primary text-white' : 'bg-gray-200 text-gray-600'}`}
              title="Line Chart"
            >
              <LineChart className="h-4 w-4" />
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-2 rounded ${chartType === 'pie' ? 'bg-waemma-primary text-white' : 'bg-gray-200 text-gray-600'}`}
              title="Pie Chart"
            >
              <PieChart className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                <dd className="text-lg font-medium text-gray-900">
                  KSh {reportData.salesSummary.totalSales.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Profit</dt>
                <dd className="text-lg font-medium text-gray-900">
                  KSh {reportData.salesSummary.totalProfit.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {reportData.salesSummary.totalTransactions}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg. Transaction</dt>
                <dd className="text-lg font-medium text-gray-900">
                  KSh {reportData.salesSummary.averageTransaction.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="h-96">
          {renderChart()}
        </div>
      </div>

      {/* Secondary Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {reportData.paymentMethods.map((method, index) => {
              const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500']
              const percentage = reportData.salesSummary.totalSales > 0 
                ? (method.amount / reportData.salesSummary.totalSales * 100).toFixed(1)
                : 0
              
              return (
                <div key={method.method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]} mr-3`}></div>
                    <span className="capitalize text-gray-900">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      KSh {method.amount.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage}% ({method.count} transactions)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {reportData.productSales.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-waemma-primary text-white rounded-full flex items-center justify-center text-xs font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-500">{product.quantity} units sold</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    KSh {product.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600">
                    +KSh {product.profit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Daily Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Transaction
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.dailySales.slice().reverse().slice(0, 10).map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {day.sales.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    KSh {day.profit.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {day.transactions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {day.transactions > 0 ? (day.sales / day.transactions).toLocaleString() : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Reports