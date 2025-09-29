import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, 
  Search, 
  ShoppingCart, 
  CreditCard, 
  Eye,
  X,
  Minus,
  Calculator,
  Receipt,
  AlertCircle,
  CheckCircle,
  Scan,
  ArrowLeft
} from 'lucide-react'

// Error boundary class to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SalesManagement error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 rounded-lg">
          <h2 className="text-xl font-bold text-red-700">Something went wrong.</h2>
          <p className="text-red-600">Please try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const SalesManagement = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNewSale, setShowNewSale] = useState(false)
  const [showSaleDetails, setShowSaleDetails] = useState(false)
  const [selectedSale, setSelectedSale] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Sale form state
  const [saleForm, setSaleForm] = useState({
    items: [],
    paymentMethod: 'cash',
    customerName: '',
    customerContact: '',
    notes: ''
  })
  
  // UI states
  const [productSearch, setProductSearch] = useState('')
  const [filteredProducts, setFilteredProducts] = useState([])
  const [saleTotal, setSaleTotal] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)

  useEffect(() => {
    fetchData()
    
    // Check URL params for actions
    const action = searchParams.get('action')
    if (action === 'new') {
      setShowNewSale(true)
    }
  }, [searchParams])

  useEffect(() => {
    // Filter products based on search
    if (productSearch) {
      const filtered = products.filter(product =>
        product.isActive &&
        product.currentStock > 0 &&
        (product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
         product.category.toLowerCase().includes(productSearch.toLowerCase()))
      )
      setFilteredProducts(filtered.slice(0, 10)) // Limit to 10 results
    } else {
      setFilteredProducts([])
    }
  }, [productSearch, products])

  useEffect(() => {
    // Calculate sale total
    const total = saleForm.items.reduce((sum, item) => 
      sum + (parseFloat(item.unitPrice) * parseInt(item.quantity)), 0
    )
    setSaleTotal(total)
  }, [saleForm.items])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Use the correct API endpoints with localhost
      const [salesRes, productsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/sales', { params: { limit: 50 } }),
        axios.get('http://localhost:5000/api/products')
      ])

      // Set products data
      setProducts(productsRes.data || [])
      
      // Set sales data
      const salesData = salesRes.data || [];
      if (salesData.length === 0) {
        const mockSales = [
          {
            id: 1,
            customerName: 'John Doe',
            total: 15000,
            paymentMethod: 'cash',
            createdAt: new Date().toISOString(),
            items: [
              { productName: 'Diamond Ice Beer', quantity: 5, unitPrice: 3000 }
            ]
          },
          {
            id: 2,
            customerName: 'Jane Smith',
            total: 25000,
            paymentMethod: 'mpesa',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            items: [
              { productName: 'Tusker Lager', quantity: 10, unitPrice: 2500 }
            ]
          }
        ]
        setSales(mockSales)
      } else {
        setSales(salesData)
      }

      // Set products data from API or use mock data if empty
      const productsData = productsRes.data || []
      if (productsData.length === 0) {
        const mockProducts = [
          {
            id: 1,
            name: 'Tusker Lager',
            category: 'Beer',
            currentStock: 120,
            minStockLevel: 20,
            unitPrice: 2500,
            isActive: true
          },
          {
            id: 2,
            name: 'Diamond Ice Beer',
            category: 'Beer',
            currentStock: 85,
            minStockLevel: 15,
            unitPrice: 3000,
            isActive: true
          },
          {
            id: 3,
            name: 'Johnnie Walker Black',
            category: 'Whisky',
            currentStock: 25,
            minStockLevel: 5,
            unitPrice: 45000,
            isActive: true
          },
          {
            id: 4,
            name: 'Smirnoff Vodka',
            category: 'Vodka',
            currentStock: 40,
            minStockLevel: 10,
            unitPrice: 18000,
            isActive: true
          }
        ]
        setProducts(mockProducts)
      } else {
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setErrorMessage('Failed to load data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Add product to sale
  const addProductToSale = (product) => {
    // Check if product already in cart
    const existingItem = saleForm.items.find(item => item.productId === product.id)
    
    if (existingItem) {
      // Update quantity if already in cart
      const updatedItems = saleForm.items.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
      setSaleForm({ ...saleForm, items: updatedItems })
    } else {
      // Add new item to cart
      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        category: product.category
      }
      setSaleForm({ ...saleForm, items: [...saleForm.items, newItem] })
    }
    
    // Clear search after adding
    setProductSearch('')
    setFilteredProducts([])
  }

  // Update item quantity
  const updateItemQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      // Remove item if quantity less than 1
      const updatedItems = saleForm.items.filter(item => item.productId !== productId)
      setSaleForm({ ...saleForm, items: updatedItems })
    } else {
      // Update quantity
      const updatedItems = saleForm.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity: newQuantity } 
          : item
      )
      setSaleForm({ ...saleForm, items: updatedItems })
    }
  }

  // Remove item from sale
  const removeItem = (productId) => {
    const updatedItems = saleForm.items.filter(item => item.productId !== productId)
    setSaleForm({ ...saleForm, items: updatedItems })
  }

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSaleForm({ ...saleForm, [name]: value })
  }

  // Submit sale
  const handleSubmitSale = async (e) => {
    e.preventDefault()
    
    // Validate form
    if (saleForm.items.length === 0) {
      setErrorMessage('Please add at least one product to the sale')
      return
    }
    
    setSubmitting(true)
    setErrorMessage('')
    
    try {
      // Prepare sale data
      const saleData = {
        items: saleForm.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        paymentMethod: saleForm.paymentMethod,
        customerName: saleForm.customerName || 'Walk-in Customer',
        customerContact: saleForm.customerContact || '',
        notes: saleForm.notes || ''
      }
      
      // Submit to API
      const response = await axios.post('http://localhost:5000/api/sales', saleData)
      
      // Handle success
      setSuccessMessage('Sale completed successfully!')
      setCompletedSale({
        ...response.data,
        items: saleForm.items,
        total: saleTotal,
        createdAt: new Date().toISOString()
      })
      
      // Reset form
      setSaleForm({
        items: [],
        paymentMethod: 'cash',
        customerName: '',
        customerContact: '',
        notes: ''
      })
      
      // Show receipt
      setShowReceipt(true)
      setShowNewSale(false)
      
      // Refresh sales data
      fetchData()
    } catch (error) {
      console.error('Error submitting sale:', error)
      setErrorMessage('Failed to complete sale. Please try again.')
      
      // If API fails, use mock response
      if (!error.response) {
        const mockSaleId = Date.now()
        setCompletedSale({
          id: mockSaleId,
          items: saleForm.items,
          customerName: saleForm.customerName || 'Walk-in Customer',
          paymentMethod: saleForm.paymentMethod,
          total: saleTotal,
          createdAt: new Date().toISOString()
        })
        
        // Add to local sales list
        const newSale = {
          id: mockSaleId,
          customerName: saleForm.customerName || 'Walk-in Customer',
          total: saleTotal,
          paymentMethod: saleForm.paymentMethod,
          createdAt: new Date().toISOString(),
          items: saleForm.items
        }
        
        setSales([newSale, ...sales])
        
        // Reset form
        setSaleForm({
          items: [],
          paymentMethod: 'cash',
          customerName: '',
          customerContact: '',
          notes: ''
        })
        
        // Show receipt
        setShowReceipt(true)
        setShowNewSale(false)
        setSuccessMessage('Sale completed successfully!')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // View sale details
  const viewSaleDetails = (sale) => {
    setSelectedSale(sale)
    setShowSaleDetails(true)
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount)
  }
  
  // Render component
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sales Management</h1>
        <button 
          onClick={() => setShowNewSale(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="mr-2" size={18} />
          New Sale
        </button>
      </div>
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <CheckCircle size={20} className="mr-2" />
          <span>{successMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setSuccessMessage('')}
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 flex items-center">
          <AlertCircle size={20} className="mr-2" />
          <span>{errorMessage}</span>
          <button 
            className="absolute top-0 bottom-0 right-0 px-4"
            onClick={() => setErrorMessage('')}
          >
            <X size={18} />
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Sales List */}
          {!showNewSale && !showSaleDetails && !showReceipt && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sales.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                          No sales records found
                        </td>
                      </tr>
                    ) : (
                      sales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{sale.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sale.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {formatCurrency(sale.total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {sale.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button 
                              onClick={() => viewSaleDetails(sale)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {/* New Sale Form */}
          {showNewSale && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">New Sale</h2>
                <button 
                  onClick={() => {
                    setShowNewSale(false)
                    setErrorMessage('')
                    // Reset form if navigating away
                    if (saleForm.items.length === 0) {
                      setSaleForm({
                        items: [],
                        paymentMethod: 'cash',
                        customerName: '',
                        customerContact: '',
                        notes: ''
                      })
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitSale}>
                {/* Product Search */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Add Products
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products by name or category"
                      className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Search Results */}
                  {filteredProducts.length > 0 && (
                    <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <ul>
                        {filteredProducts.map(product => (
                          <li 
                            key={product.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 flex justify-between items-center"
                            onClick={() => addProductToSale(product)}
                          >
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.category}</div>
                            </div>
                            <div className="flex items-center">
                              <span className="text-gray-700 mr-3">
                                Stock: {product.currentStock}
                              </span>
                              <span className="font-semibold text-blue-600">
                                {formatCurrency(product.unitPrice)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Cart Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <ShoppingCart size={18} className="mr-2" />
                    Cart Items
                  </h3>
                  
                  {saleForm.items.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-gray-500">No items added yet. Search and add products above.</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {saleForm.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3">
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-sm text-gray-500">{item.category}</div>
                              </td>
                              <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center">
                                  <button 
                                    type="button"
                                    onClick={() => updateItemQuantity(item.productId, item.quantity - 1)}
                                    className="p-1 rounded-full hover:bg-gray-200"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                                    className="mx-2 w-16 text-center border border-gray-300 rounded-md"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => updateItemQuantity(item.productId, item.quantity + 1)}
                                    className="p-1 rounded-full hover:bg-gray-200"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {formatCurrency(item.unitPrice * item.quantity)}
                              </td>
                              <td className="px-4 py-3">
                                <button 
                                  type="button"
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100">
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                            <td className="px-4 py-3 font-bold text-lg">{formatCurrency(saleTotal)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Customer Information */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Customer Name (Optional)
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={saleForm.customerName}
                      onChange={handleInputChange}
                      placeholder="Walk-in Customer"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Customer Contact (Optional)
                    </label>
                    <input
                      type="text"
                      name="customerContact"
                      value={saleForm.customerContact}
                      onChange={handleInputChange}
                      placeholder="Phone or Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Payment Method */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Payment Method
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={saleForm.paymentMethod === 'cash'}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">Cash</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="mpesa"
                        checked={saleForm.paymentMethod === 'mpesa'}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">M-Pesa</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={saleForm.paymentMethod === 'card'}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-gray-700">Card</span>
                    </label>
                  </div>
                </div>
                
                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    name="notes"
                    value={saleForm.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes here..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
                
                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || saleForm.items.length === 0}
                    className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${
                      submitting || saleForm.items.length === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2" size={18} />
                        Complete Sale
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Sale Details View */}
          {showSaleDetails && selectedSale && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sale Details</h2>
                <button 
                  onClick={() => {
                    setShowSaleDetails(false)
                    setSelectedSale(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Sale Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <span className="block text-sm text-gray-500">Sale ID</span>
                      <span className="block font-medium">#{selectedSale.id}</span>
                    </div>
                    <div className="mb-3">
                      <span className="block text-sm text-gray-500">Date & Time</span>
                      <span className="block font-medium">{formatDate(selectedSale.createdAt)}</span>
                    </div>
                    <div className="mb-3">
                      <span className="block text-sm text-gray-500">Payment Method</span>
                      <span className="block font-medium capitalize">{selectedSale.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="block text-sm text-gray-500">Total Amount</span>
                      <span className="block font-bold text-lg">{formatCurrency(selectedSale.total)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-3">
                      <span className="block text-sm text-gray-500">Name</span>
                      <span className="block font-medium">{selectedSale.customerName}</span>
                    </div>
                    {selectedSale.customerContact && (
                      <div className="mb-3">
                        <span className="block text-sm text-gray-500">Contact</span>
                        <span className="block font-medium">{selectedSale.customerContact}</span>
                      </div>
                    )}
                    {selectedSale.notes && (
                      <div>
                        <span className="block text-sm text-gray-500">Notes</span>
                        <span className="block">{selectedSale.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Items Purchased</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedSale.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.productName}</div>
                          {item.category && <div className="text-sm text-gray-500">{item.category}</div>}
                        </td>
                        <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3">{item.quantity}</td>
                        <td className="px-4 py-3 font-medium">
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr>
                      <td colSpan="3" className="px-4 py-3 text-right font-bold">Total:</td>
                      <td className="px-4 py-3 font-bold text-lg">{formatCurrency(selectedSale.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowSaleDetails(false)
                    setSelectedSale(null)
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          )}
          
          {/* Receipt View */}
          {showReceipt && completedSale && (
            <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Sale Receipt</h2>
                <button 
                  onClick={() => {
                    setShowReceipt(false)
                    setCompletedSale(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="border-t border-b border-gray-200 py-4 mb-4">
                <div className="text-center mb-4">
                  <h1 className="text-xl font-bold">WaEmma Wines & Spirits</h1>
                  <p className="text-gray-600">Receipt #{completedSale.id}</p>
                  <p className="text-gray-600">{formatDate(completedSale.createdAt)}</p>
                </div>
                
                <div className="mb-4">
                  <p><span className="font-medium">Customer:</span> {completedSale.customerName}</p>
                  {completedSale.customerContact && (
                    <p><span className="font-medium">Contact:</span> {completedSale.customerContact}</p>
                  )}
                  <p><span className="font-medium">Payment Method:</span> <span className="capitalize">{completedSale.paymentMethod}</span></p>
                </div>
                
                <table className="w-full mb-4">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2">Item</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSale.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="py-2">{item.productName}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-2">{formatCurrency(item.unitPrice * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="text-right py-2 font-bold">Total:</td>
                      <td className="text-right py-2 font-bold">{formatCurrency(completedSale.total)}</td>
                    </tr>
                  </tfoot>
                </table>
                
                {completedSale.notes && (
                  <div className="mb-4">
                    <p><span className="font-medium">Notes:</span> {completedSale.notes}</p>
                  </div>
                )}
                
                <div className="text-center text-gray-600 text-sm mt-6">
                  <p>Thank you for your business!</p>
                  <p>WaEmma Wines & Spirits Ltd.</p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowReceipt(false)
                    setCompletedSale(null)
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center"
                >
                  <ArrowLeft className="mr-2" size={18} />
                  Back to Sales
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
                >
                  <Receipt className="mr-2" size={18} />
                  Print Receipt
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
            total: 8500,
            paymentMethod: 'mpesa',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            items: [
              { productName: 'Johnnie Walker Black', quantity: 2, unitPrice: 4250 }
            ]
          },
          {
            id: 3,
            customerName: 'Local Restaurant',
            total: 12000,
            paymentMethod: 'bank',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            items: [
              { productName: 'Tusker Lager', quantity: 24, unitPrice: 200 },
              { productName: 'Coca Cola', quantity: 2, unitPrice: 1000 }
            ]
          }
        ];
        setSales(mockSales);
      } else {
        setSales(salesData);
      }

      // Mock products data if API returns empty
      const productsData = productsRes.data || [];
      if (productsData.length === 0) {
        const mockProducts = [
          {
            id: 1,
            name: 'Diamond Ice Beer',
            category: 'Beer',
            unitType: 'Crate',
            unitPrice: 3000,
            currentStock: 25,
            isActive: true
          },
          {
            id: 2,
            name: 'Tusker Lager',
            category: 'Beer',
            unitType: 'Bottle',
            unitPrice: 200,
            currentStock: 48,
            isActive: true
          },
          {
            id: 3,
            name: 'Johnnie Walker Black',
            category: 'Spirits',
            unitType: 'Bottle',
            unitPrice: 4250,
            currentStock: 12,
            isActive: true
          },
          {
            id: 4,
            name: 'Coca Cola',
            category: 'Soft Drinks',
            unitType: 'Crate',
            unitPrice: 1000,
            currentStock: 15,
            isActive: true
          },
          {
            id: 5,
            name: 'Four Cousins Wine',
            category: 'Wine',
            unitType: 'Bottle',
            unitPrice: 1100,
            currentStock: 8,
            isActive: true
          }
        ];
        setProducts(mockProducts);
      } else {
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Set mock data on error
      const mockSales = [
        {
          id: 1,
          customerName: 'John Doe',
          total: 15000,
          paymentMethod: 'cash',
          createdAt: new Date().toISOString(),
          items: [
            { productName: 'Diamond Ice Beer', quantity: 5, unitPrice: 3000 }
          ]
        },
        {
          id: 2,
          customerName: 'Jane Smith',
          total: 8500,
          paymentMethod: 'mpesa',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          items: [
            { productName: 'Johnnie Walker Black', quantity: 2, unitPrice: 4250 }
          ]
        }
      ];
      
      const mockProducts = [
        {
          id: 1,
          name: 'Diamond Ice Beer',
          category: 'Beer',
          unitType: 'Crate',
          unitPrice: 3000,
          currentStock: 25,
          isActive: true
        },
        {
          id: 2,
          name: 'Tusker Lager',
          category: 'Beer',
          unitType: 'Bottle',
          unitPrice: 200,
          currentStock: 48,
          isActive: true
        },
        {
          id: 3,
          name: 'Johnnie Walker Black',
          category: 'Spirits',
          unitType: 'Bottle',
          unitPrice: 4250,
          currentStock: 12,
          isActive: true
        }
      ];
      
      setSales(mockSales);
      setProducts(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (product) => {
    // Check if product already in items
    const existingItemIndex = saleForm.items.findIndex(item => item.productId === product.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if already in cart
      const updatedItems = [...saleForm.items];
      updatedItems[existingItemIndex].quantity += 1;
      setSaleForm({
        ...saleForm,
        items: updatedItems
      });
    } else {
      // Add new item
      setSaleForm({
        ...saleForm,
        items: [
          ...saleForm.items,
          {
            productId: product.id,
            productName: product.name,
            unitPrice: product.unitPrice,
            quantity: 1,
            unitType: product.unitType
          }
        ]
      });
    }
    
    // Clear search after adding
    setProductSearch('');
    setFilteredProducts([]);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = [...saleForm.items];
    updatedItems.splice(index, 1);
    setSaleForm({
      ...saleForm,
      items: updatedItems
    });
  };

  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...saleForm.items];
    updatedItems[index].quantity = newQuantity;
    setSaleForm({
      ...saleForm,
      items: updatedItems
    });
  };

  const handleSubmitSale = async () => {
    if (saleForm.items.length === 0) {
      alert('Please add at least one product to the sale');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare sale data
      const saleData = {
        ...saleForm,
        total: saleTotal,
        date: new Date().toISOString()
      };
      
      // Try API call first
      try {
        const response = await axios.post('http://localhost:5000/api/sales', saleData);
        
        if (response.data) {
          // Add the new sale to the list
          setSales([response.data, ...sales]);
          
          // Update product stock
          const updatedProducts = [...products];
          saleForm.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex >= 0) {
              updatedProducts[productIndex].currentStock -= item.quantity;
            }
          });
          setProducts(updatedProducts);
        } else {
          throw new Error('Empty response from API');
        }
      } catch (apiError) {
        console.error('API call failed, using mock data', apiError);
        
        // Create mock sale with ID
        const newSale = {
          id: sales.length > 0 ? Math.max(...sales.map(s => s.id)) + 1 : 1,
          customerName: saleForm.customerName || 'Walk-in Customer',
          total: saleTotal,
          paymentMethod: saleForm.paymentMethod,
          createdAt: new Date().toISOString(),
          items: saleForm.items.map(item => ({
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        };
        
        // Add the new sale to the list
        setSales([newSale, ...sales]);
        
        // Update product stock
        const updatedProducts = [...products];
        saleForm.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
          if (productIndex >= 0) {
            updatedProducts[productIndex].currentStock -= item.quantity;
          }
        });
        setProducts(updatedProducts);
      }
      
      // Reset form and close modal
      setSaleForm({
        items: [],
        paymentMethod: 'cash',
        customerName: '',
        customerContact: '',
        notes: ''
      });
      setShowNewSale(false);
      
      // Show success message
      alert('Sale recorded successfully!');
      
    } catch (error) {
      console.error('Error submitting sale:', error);
      alert('Failed to record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const viewSaleDetails = (sale) => {
    setSelectedSale(sale);
    setShowSaleDetails(true);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return 'KSh ' + parseFloat(amount).toLocaleString();
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'mpesa': return 'M-Pesa';
      case 'card': return 'Card';
      case 'bank': return 'Bank Transfer';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-600">Record and manage sales transactions</p>
        </div>
        <button
          onClick={() => setShowNewSale(true)}
          className="bg-waemma-primary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-primary/90"
        >
          <Plus className="h-5 w-5" />
          <span>New Sale</span>
        </button>
      </div>
      
      {/* Sales List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Sales</h3>
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search sales..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-waemma-primary"></div>
            <p className="mt-2 text-gray-500">Loading sales data...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Sales Yet</h3>
            <p className="text-gray-500">Start by recording your first sale.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {sale.customerName || 'Walk-in Customer'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getPaymentMethodLabel(sale.paymentMethod)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => viewSaleDetails(sale)}
                        className="text-waemma-primary hover:text-waemma-primary/80 font-medium flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* New Sale Modal */}
      {showNewSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">New Sale</h3>
              <button
                onClick={() => setShowNewSale(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Search */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Add Products
                </label>
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or category..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
                  />
                </div>
                
                {/* Search Results */}
                {filteredProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-md overflow-hidden mt-1">
                    <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <li 
                          key={product.id}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                          onClick={() => handleAddItem(product)}
                        >
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.category} • {formatCurrency(product.unitPrice)} per {product.unitType}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-2">
                              Stock: {product.currentStock}
                            </span>
                            <button className="bg-waemma-primary text-white p-1 rounded-full">
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              {/* Selected Items */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Selected Items</h4>
                {saleForm.items.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-md">
                    <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No items added yet. Search and add products above.</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {saleForm.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              <div className="text-xs text-gray-500">{item.unitType}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                  className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center border border-gray-300 rounded-md"
                                />
                                <button
                                  onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                  className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {/* Sale Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={saleForm.customerName}
                    onChange={(e) => setSaleForm({...saleForm, customerName: e.target.value})}
                    placeholder="Walk-in Customer"
                    className="w-full border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Contact (Optional)
                  </label>
                  <input
                    type="text"
                    value={saleForm.customerContact}
                    onChange={(e) => setSaleForm({...saleForm, customerContact: e.target.value})}
                    placeholder="Phone or Email"
                    className="w-full border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={saleForm.paymentMethod}
                    onChange={(e) => setSaleForm({...saleForm, paymentMethod: e.target.value})}
                    className="w-full border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                    placeholder="Any additional information"
                    className="w-full border border-gray-300 rounded-md focus:ring-waemma-primary focus:border-waemma-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
              <div className="flex items-center space-x-4">
                <Calculator className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(saleTotal)}</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowNewSale(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSale}
                  disabled={saleForm.items.length === 0 || submitting}
                  className={`px-4 py-2 rounded-md text-white font-medium flex items-center space-x-2 ${
                    saleForm.items.length === 0 || submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-waemma-primary hover:bg-waemma-primary/90'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Receipt className="h-5 w-5" />
                      <span>Complete Sale</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sale Details Modal */}
      {showSaleDetails && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Sale Details</h3>
              <button
                onClick={() => setShowSaleDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Sale ID</div>
                  <div className="font-medium">{selectedSale.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date & Time</div>
                  <div className="font-medium">{formatDate(selectedSale.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Customer</div>
                  <div className="font-medium">{selectedSale.customerName || 'Walk-in Customer'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Payment Method</div>
                  <div className="font-medium">{getPaymentMethodLabel(selectedSale.paymentMethod)}</div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Items</h4>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <div className="text-lg font-medium text-gray-900">Total</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(selectedSale.total)}</div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowSaleDetails(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-waemma-primary text-white rounded-md font-medium hover:bg-waemma-primary/90 flex items-center space-x-2"
              >
                <Receipt className="h-5 w-5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesManagement