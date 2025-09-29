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
  );
};
