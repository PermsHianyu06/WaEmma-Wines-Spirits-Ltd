import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  Plus,
  AlertTriangle,
  RefreshCw,
  Wine,
  Users,
  Calendar,
  Receipt,
  FileText,
  TrendingDown,
  Truck,
  BarChart2
} from 'lucide-react'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    todaySales: 127500,
    todayTransactions: 48,
    inventoryAlerts: 7,
    profitMargin: 24.8,
    salesGrowth: 12.5,
    transactionGrowth: 8.3,
    inventoryChange: 2,
    profitGrowth: 1.2,
    loading: true
  })
  
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [topSellingProducts, setTopSellingProducts] = useState([])
  
  useEffect(() => {
    // Fetch dashboard data from API
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products')
        
        // Mock low stock products
        const mockLowStock = response.data
          .filter(product => product.stock < 10)
          .slice(0, 5)
          .map(product => ({
            id: product.id,
            name: product.name,
            stock: product.stock,
            minStock: 10
          }))
        
        // Mock top selling products
        const mockTopSelling = [
          { id: 1, name: 'Diamond Ice Beer', sales: 120, revenue: 36000 },
          { id: 2, name: 'Red Wine', sales: 85, revenue: 25500 },
          { id: 3, name: 'Vodka Premium', sales: 62, revenue: 18600 }
        ]
        
        setLowStockProducts(mockLowStock)
        setTopSellingProducts(mockTopSelling)
        setDashboardData(prev => ({ ...prev, loading: false }))
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setDashboardData(prev => ({ ...prev, loading: false }))
      }
    }
    
    fetchDashboardData()
  }, [])

  const getCurrentTime = () => {
    const now = new Date()
    return {
      time: now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      date: now.toLocaleDateString('en-US', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      })
    }
  }

  const [currentTime, setCurrentTime] = useState(getCurrentTime())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const StatCard = ({ title, value, icon: Icon, color, trendValue, isNegative = false }) => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className={`flex items-center space-x-1 ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
            {isNegative ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            <span className="text-sm font-medium">{trendValue}</span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )

  const QuickActionCard = ({ title, icon: Icon, color, onClick }) => (
    <button
      onClick={onClick}
      className={`${color} text-white p-4 rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity w-full`}
    >
      <Icon className="h-5 w-5" />
      <span>{title}</span>
    </button>
  )

  return (
    <div className="space-y-8">
      {/* Page Header with Time */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Admin! 👋</h1>
          <p className="text-gray-600">Here's what's happening with WaEmma Wines today</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-gray-900">{currentTime.time}</p>
          <p className="text-sm text-gray-600">{currentTime.date}</p>
        </div>
      </div>
      
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/inventory?action=add">
          <QuickActionCard 
            title="Add Product" 
            icon={Plus} 
            color="bg-purple-700" 
          />
        </Link>
        <Link to="/sales?action=new">
          <QuickActionCard 
            title="Make Sale" 
            icon={ShoppingCart} 
            color="bg-blue-600" 
          />
        </Link>
        <Link to="/inventory?action=delivery">
          <QuickActionCard 
            title="Record Delivery" 
            icon={Truck} 
            color="bg-green-600" 
          />
        </Link>
        <Link to="/reports">
          <QuickActionCard 
            title="View Reports" 
            icon={BarChart2} 
            color="bg-amber-600" 
          />
        </Link>
      </div>
      
      {/* Low Stock Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Low Stock Alerts
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData.loading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : lowStockProducts.length > 0 ? (
            lowStockProducts.map(product => (
              <div key={product.id} className="p-4 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <p className="text-sm text-red-600">
                    Current stock: {product.stock} (Minimum: {product.minStock})
                  </p>
                </div>
                <Link 
                  to={`/inventory/${product.id}`}
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  View
                </Link>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No low stock alerts</div>
          )}
        </div>
      </div>
      
      {/* Diamond Ice Crate Tracking */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Package className="h-5 w-5 text-blue-500 mr-2" />
            Diamond Ice Crate Tracking
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Full Crates in Stock</h4>
              <p className="text-2xl font-bold text-gray-900">124</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Empty Crates Returned</h4>
              <p className="text-2xl font-bold text-gray-900">98</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-500 mb-1">Crate Balance (Short)</h4>
              <p className="text-2xl font-bold text-gray-900">26</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link 
              to="/crates"
              className="text-purple-700 hover:text-purple-900 text-sm font-medium flex items-center"
            >
              View detailed tracking
              <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={`KES ${dashboardData.todaySales.toLocaleString()}`}
          icon={TrendingUp}
          color="bg-waemma-primary"
          trendValue={`${dashboardData.salesGrowth}%`}
        />
        
        <StatCard
          title="Total Transactions"
          value={dashboardData.todayTransactions}
          icon={ShoppingCart}
          color="bg-waemma-secondary"
          trendValue={`${dashboardData.transactionGrowth}%`}
        />
        
        <StatCard
          title="Inventory Alerts"
          value={dashboardData.inventoryAlerts}
          icon={AlertTriangle}
          color="bg-orange-500"
          trendValue={dashboardData.inventoryChange}
          isNegative={false}
        />
        
        <StatCard
          title="Profit Margin"
          value={`${dashboardData.profitMargin}%`}
          icon={DollarSign}
          color="bg-green-500"
          trendValue={`${dashboardData.profitGrowth}%`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Sales Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Weekly Sales Overview</h2>
                <p className="text-sm text-gray-600">Revenue and transaction trends for the past 7 days</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-waemma-primary rounded-full"></div>
                <span className="text-sm text-gray-600">Sales Revenue</span>
              </div>
            </div>
            
            {/* Placeholder for chart */}
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Sales Chart Component</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              <p className="text-sm text-gray-600">Access frequently used features</p>
            </div>
            
            <div className="space-y-3">
              <QuickActionCard
                title="New Transaction"
                icon={Plus}
                color="bg-waemma-primary"
                onClick={() => {}}
              />
              
              <QuickActionCard
                title="Manage Inventory"
                icon={Package}
                color="bg-waemma-secondary"
                onClick={() => {}}
              />
              
              <QuickActionCard
                title="View Reports"
                icon={FileText}
                color="bg-gray-600"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Recent Activity or Low Stock Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Johnnie Walker Red</p>
                  <p className="text-sm text-gray-600">5 units remaining</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Tusker Lager</p>
                  <p className="text-sm text-gray-600">12 units remaining</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard