import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Wine, 
  Package, 
  ArrowUp, 
  ArrowDown, 
  Plus,
  Minus,
  Save,
  RefreshCw,
  Calendar,
  User,
  FileText
} from 'lucide-react'

const CrateTracking = () => {
  const [crateBalances, setCrateBalances] = useState([])
  const [crateHistory, setCrateHistory] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  
  // Form states
  const [returnForm, setReturnForm] = useState({
    productId: '',
    cratesReturned: '',
    notes: ''
  })
  
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    adjustment: '',
    notes: ''
  })

  useEffect(() => {
    fetchCrateBalances()
  }, [])

  useEffect(() => {
    if (selectedProduct) {
      fetchCrateHistory(selectedProduct.productId)
    }
  }, [selectedProduct])

  const fetchCrateBalances = async () => {
    try {
      const response = await axios.get('/api/crates/balances')
      setCrateBalances(response.data)
    } catch (error) {
      console.error('Error fetching crate balances:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCrateHistory = async (productId) => {
    try {
      const response = await axios.get(`/api/crates/product/${productId}`)
      setCrateHistory(response.data.crateHistory || [])
    } catch (error) {
      console.error('Error fetching crate history:', error)
    }
  }

  const openReturnModal = (product) => {
    setReturnForm({
      productId: product.productId,
      cratesReturned: '',
      notes: ''
    })
    setShowReturnModal(true)
  }

  const openAdjustModal = (product) => {
    setAdjustForm({
      productId: product.productId,
      adjustment: '',
      notes: ''
    })
    setShowAdjustModal(true)
  }

  const handleCrateReturn = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/crates/return', returnForm)
      setShowReturnModal(false)
      fetchCrateBalances()
      if (selectedProduct && selectedProduct.productId === returnForm.productId) {
        fetchCrateHistory(selectedProduct.productId)
      }
      alert('Crate return recorded successfully!')
    } catch (error) {
      console.error('Error recording crate return:', error)
      alert('Error recording crate return: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleBalanceAdjustment = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/crates/adjust', adjustForm)
      setShowAdjustModal(false)
      fetchCrateBalances()
      if (selectedProduct && selectedProduct.productId === adjustForm.productId) {
        fetchCrateHistory(selectedProduct.productId)
      }
      alert('Crate balance adjusted successfully!')
    } catch (error) {
      console.error('Error adjusting crate balance:', error)
      alert('Error adjusting crate balance: ' + (error.response?.data?.error || error.message))
    }
  }

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'delivery':
        return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'sale':
        return <ArrowDown className="h-4 w-4 text-red-600" />
      case 'return':
        return <ArrowUp className="h-4 w-4 text-blue-600" />
      case 'adjustment':
        return <FileText className="h-4 w-4 text-yellow-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionColor = (type) => {
    switch (type) {
      case 'delivery':
        return 'bg-green-100 text-green-800'
      case 'sale':
        return 'bg-red-100 text-red-800'
      case 'return':
        return 'bg-blue-100 text-blue-800'
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-waemma-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crate Tracking</h1>
          <p className="text-gray-600">Monitor and manage Diamond Ice beer crate balances</p>
        </div>
        <button
          onClick={fetchCrateBalances}
          className="bg-gray-600 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-gray-700"
        >
          <RefreshCw className="h-5 w-5" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crate Balances */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Crate Balances</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {crateBalances.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Wine className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No products with crate tracking found</p>
                <p className="text-sm">Enable crate tracking on products in inventory management</p>
              </div>
            ) : (
              crateBalances.map((balance) => (
                <div 
                  key={balance.productId} 
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${selectedProduct?.productId === balance.productId ? 'bg-blue-50 border-l-4 border-waemma-primary' : ''}`}
                  onClick={() => setSelectedProduct(balance)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Wine className="h-8 w-8 text-waemma-primary mr-4" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{balance.productName}</h3>
                        <p className="text-sm text-gray-500">
                          Last updated: {balance.lastUpdated ? new Date(balance.lastUpdated).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${balance.currentBalance > 0 ? 'text-red-600' : balance.currentBalance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {balance.currentBalance}
                      </div>
                      <div className="text-sm text-gray-500">
                        {balance.currentBalance > 0 ? 'Crates Owed' : balance.currentBalance < 0 ? 'Credit Balance' : 'Balanced'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openReturnModal(balance)
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                    >
                      <ArrowUp className="h-3 w-3" />
                      <span>Return Crates</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openAdjustModal(balance)
                      }}
                      className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 flex items-center space-x-1"
                    >
                      <FileText className="h-3 w-3" />
                      <span>Adjust</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Crate History */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {selectedProduct ? `${selectedProduct.productName} History` : 'Transaction History'}
            </h2>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {!selectedProduct ? (
              <div className="p-6 text-center text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a product to view crate transaction history</p>
              </div>
            ) : crateHistory.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No transaction history found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {crateHistory.map((record) => (
                  <div key={record.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getTransactionIcon(record.transactionType)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getTransactionColor(record.transactionType)}`}>
                              {record.transactionType}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-900">
                            {record.cratesReceived > 0 && (
                              <span className="text-green-600">+{record.cratesReceived} received</span>
                            )}
                            {record.cratesReturned > 0 && (
                              <span className="text-red-600">-{record.cratesReturned} returned</span>
                            )}
                          </div>
                          
                          {record.notes && (
                            <div className="mt-1 text-sm text-gray-600">
                              {record.notes}
                            </div>
                          )}
                          
                          <div className="mt-1 text-xs text-gray-500 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {record.processor?.fullName || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          Balance: {record.cratesBalance}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Return Crates Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Return Empty Crates</h3>
              <p className="text-sm text-gray-600">Record empty crates returned to supplier</p>
            </div>

            <form onSubmit={handleCrateReturn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Crates Returned
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={returnForm.cratesReturned}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, cratesReturned: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  placeholder="Enter number of crates"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  placeholder="Additional notes..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Record Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">Adjust Crate Balance</h3>
              <p className="text-sm text-gray-600">Manual adjustment to crate balance</p>
            </div>

            <form onSubmit={handleBalanceAdjustment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment
                </label>
                <input
                  type="number"
                  required
                  value={adjustForm.adjustment}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, adjustment: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  placeholder="Positive to increase, negative to decrease"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to increase balance, negative to decrease
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  value={adjustForm.notes}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  placeholder="Explain the reason for this adjustment..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrateTracking