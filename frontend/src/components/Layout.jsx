import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  Wine, 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  LogOut, 
  Bell,
  User,
  ChevronDown,
  Package2,
  Receipt
} from 'lucide-react'

const Layout = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isCurrentPage = (href) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-waemma-primary rounded-lg flex items-center justify-center">
                  <Wine className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">WaEmma Wines</h1>
                  <p className="text-sm text-waemma-primary font-medium">Inventory Management</p>
                </div>
              </div>
              
              {/* Main Navigation */}
              <nav className="hidden md:flex ml-8 space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const current = isCurrentPage(item.href)
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        current
                          ? 'bg-waemma-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      } px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      {item.name === 'Inventory' && (
                        <span className="ml-1 bg-orange-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">1</span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            {/* Right side - User info and notifications */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                <span>Last sync: 2 min ago</span>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span>System Online</span>
                </div>
              </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-orange-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">4</span>
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 text-left"
                >
                  <div className="h-8 w-8 bg-waemma-primary rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                    <p className="text-xs text-gray-500">Store Manager</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Quick Actions Bar */}
      {location.pathname === '/sales' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-600">QUICK ACTIONS</span>
                <button className="bg-waemma-primary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-accent transition-colors text-sm">
                  <ShoppingCart className="h-4 w-4" />
                  <span>New Transaction</span>
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-gray-700 transition-colors text-sm">
                  <Receipt className="h-4 w-4" />
                  <span>View Receipt</span>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Last sync: 2 min ago</span>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-500">System Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout