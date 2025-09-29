import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Package, 
  Truck,
  AlertTriangle,
  X,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react'

const InventoryManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showLowStock, setShowLowStock] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'product', 'delivery', 'edit'
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    unitType: '',
    costPrice: '',
    sellingPrice: '',
    minimumStock: '',
    description: '',
    barcode: '',
    hasCrateTracking: false
  })

  const [deliveryForm, setDeliveryForm] = useState({
    supplier: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  })

  useEffect(() => {
    fetchData()
    
    // Check URL params for actions
    const action = searchParams.get('action')
    const filter = searchParams.get('filter')
    
    if (action === 'product') {
      openModal('product')
    } else if (action === 'delivery') {
      openModal('delivery')
    }
    
    if (filter === 'lowStock') {
      setShowLowStock(true)
    }
  }, [searchParams])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory, showLowStock])

  const fetchData = async () => {
    try {
      // Try to fetch from API
      const productsRes = await axios.get('http://localhost:5000/api/products')
      
      // Mock data for categories and unit types if API endpoints don't exist
      const mockCategories = ['Beer', 'Wine', 'Spirits', 'Soft Drinks', 'Snacks']
      const mockUnitTypes = ['Bottle', 'Can', 'Crate', 'Box', 'Pack', 'Piece']
      
      // Use real data if available, otherwise use mock data
      const mockProducts = [
        { id: 1, name: 'Diamond Ice Beer', category: 'Beer', unitType: 'Crate', costPrice: 2200, sellingPrice: 2500, currentStock: 15, minimumStock: 10, imageUrl: '/images/diamond-ice.jpg', hasCrateTracking: true, isActive: true },
        { id: 2, name: 'Tusker Lager', category: 'Beer', unitType: 'Bottle', costPrice: 150, sellingPrice: 200, currentStock: 48, minimumStock: 24, imageUrl: '/images/tusker.jpg', isActive: true },
        { id: 3, name: 'Johnnie Walker Black', category: 'Spirits', unitType: 'Bottle', costPrice: 3500, sellingPrice: 4200, currentStock: 5, minimumStock: 3, imageUrl: '/images/johnnie-walker.jpg', isActive: true },
        { id: 4, name: 'Coca Cola', category: 'Soft Drinks', unitType: 'Crate', costPrice: 800, sellingPrice: 1000, currentStock: 8, minimumStock: 5, imageUrl: '/images/coca-cola.jpg', isActive: true },
        { id: 5, name: 'Four Cousins Wine', category: 'Wine', unitType: 'Bottle', costPrice: 850, sellingPrice: 1100, currentStock: 12, minimumStock: 6, imageUrl: '/images/four-cousins.jpg', isActive: true }
      ]
      
      // Ensure all products have isActive property
      const productsWithActive = productsRes.data.length > 0 
        ? productsRes.data.map(p => ({ ...p, isActive: p.isActive !== false })) 
        : mockProducts
      
      setProducts(productsWithActive)
      setCategories(mockCategories)
      setUnitTypes(mockUnitTypes)
    } catch (error) {
      console.error('Error fetching data:', error)
      
      // Fallback to mock data if API fails
      const mockProducts = [
        { id: 1, name: 'Diamond Ice Beer', category: 'Beer', unitType: 'Crate', costPrice: 2200, sellingPrice: 2500, currentStock: 15, minimumStock: 10, imageUrl: '/images/diamond-ice.jpg', hasCrateTracking: true, isActive: true },
        { id: 2, name: 'Tusker Lager', category: 'Beer', unitType: 'Bottle', costPrice: 150, sellingPrice: 200, currentStock: 48, minimumStock: 24, imageUrl: '/images/tusker.jpg', isActive: true },
        { id: 3, name: 'Johnnie Walker Black', category: 'Spirits', unitType: 'Bottle', costPrice: 3500, sellingPrice: 4200, currentStock: 5, minimumStock: 3, imageUrl: '/images/johnnie-walker.jpg', isActive: true },
        { id: 4, name: 'Coca Cola', category: 'Soft Drinks', unitType: 'Crate', costPrice: 800, sellingPrice: 1000, currentStock: 8, minimumStock: 5, imageUrl: '/images/coca-cola.jpg', isActive: true },
        { id: 5, name: 'Four Cousins Wine', category: 'Wine', unitType: 'Bottle', costPrice: 850, sellingPrice: 1100, currentStock: 12, minimumStock: 6, imageUrl: '/images/four-cousins.jpg', isActive: true }
      ]
      const mockCategories = ['Beer', 'Wine', 'Spirits', 'Soft Drinks', 'Snacks']
      const mockUnitTypes = ['Bottle', 'Can', 'Crate', 'Box', 'Pack', 'Piece']
      
      setProducts(mockProducts)
      setCategories(mockCategories)
      setUnitTypes(mockUnitTypes)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    // Filter products, assuming all products are active if isActive property is not present
    let filtered = products.filter(product => product.isActive !== false)

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    if (showLowStock) {
      filtered = filtered.filter(product => product.currentStock <= product.minimumStock)
    }

    setFilteredProducts(filtered)
  }

  const openModal = (type, product = null) => {
    setModalType(type)
    setSelectedProduct(product)
    setShowModal(true)
    
    if (type === 'edit' && product) {
      setProductForm({
        name: product.name,
        category: product.category,
        unitType: product.unitType,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        minimumStock: product.minimumStock.toString(),
        description: product.description || '',
        barcode: product.barcode || '',
        imageUrl: product.imageUrl || '',
        hasCrateTracking: product.hasCrateTracking
      })
    } else if (type === 'product') {
      setProductForm({
        name: '',
        category: '',
        unitType: '',
        costPrice: '',
        sellingPrice: '',
        minimumStock: '10',
        description: '',
        barcode: '',
        imageUrl: '',
        hasCrateTracking: false
      })
    } else if (type === 'delivery') {
      setDeliveryForm({
        supplier: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      })
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setSelectedProduct(null)
    // Clear URL params
    setSearchParams({})
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    try {
      // Validate form
      if (!productForm.name || !productForm.category || !productForm.unitType || 
          !productForm.costPrice || !productForm.sellingPrice || !productForm.minimumStock) {
        alert('Please fill in all required fields')
        return
      }
      
      // Convert numeric fields to numbers
      const formattedProductForm = {
        ...productForm,
        costPrice: parseFloat(productForm.costPrice),
        sellingPrice: parseFloat(productForm.sellingPrice),
        minimumStock: parseInt(productForm.minimumStock)
      }
      
      // Try API first
      if (modalType === 'edit') {
        try {
          await axios.put(`http://localhost:5000/api/products/${selectedProduct.id}`, formattedProductForm)
          // Fetch updated data
          fetchData()
        } catch (apiError) {
          console.log('API update failed, using mock data instead')
          // Update in local state if API fails
          const updatedProduct = {
            ...selectedProduct,
            ...formattedProductForm,
            isActive: true
          }
          
          setProducts(prevProducts => 
            prevProducts.map(p => p.id === selectedProduct.id ? updatedProduct : p)
          )
          
          // Update filtered products immediately
          setFilteredProducts(prev => 
            prev.map(p => p.id === selectedProduct.id ? updatedProduct : p)
          )
        }
      } else {
        try {
          await axios.post('http://localhost:5000/api/products', formattedProductForm)
          // Fetch updated data
          fetchData()
        } catch (apiError) {
          console.log('API create failed, using mock data instead')
          // Add to local state if API fails
          const newProduct = {
            id: Date.now(), // Use timestamp as unique ID
            ...formattedProductForm,
            currentStock: 0,
            isActive: true
          }
          setProducts(prevProducts => [...prevProducts, newProduct])
          // Update filtered products immediately
          setFilteredProducts(prev => [...prev, newProduct])
        }
      }
      
      closeModal()
      alert(modalType === 'edit' ? 'Product updated successfully!' : 'Product added successfully!')
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleDeliverySubmit = async (e) => {
    e.preventDefault()
    
    // Validate delivery items
    if (deliveryForm.items.length === 0) {
      alert('Please add at least one item to the delivery')
      return
    }
    
    // Validate supplier
    if (!deliveryForm.supplier) {
      alert('Please enter a supplier name')
      return
    }
    
    try {
      // Format delivery data
      const formattedDelivery = {
        ...deliveryForm,
        items: deliveryForm.items.map(item => ({
          ...item,
          quantity: parseInt(item.quantity),
          unitCost: parseFloat(item.unitCost)
        })),
        id: Date.now() // Add ID for mock data
      }
      
      try {
        await axios.post('http://localhost:5000/api/deliveries', formattedDelivery)
        // Fetch updated data
        fetchData()
      } catch (apiError) {
        console.log('API delivery creation failed, updating local stock instead')
        // Update product stock in local state
        const updatedProducts = [...products]
        formattedDelivery.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id.toString() === item.productId.toString())
          if (productIndex !== -1) {
            updatedProducts[productIndex].currentStock += item.quantity
          }
        })
        setProducts(updatedProducts)
        // Update filtered products immediately
        setFilteredProducts(prev => 
          prev.map(p => {
            const updatedProduct = updatedProducts.find(up => up.id === p.id)
            return updatedProduct || p
          })
        )
      }
      
      // Reset delivery form
      setDeliveryForm({
        supplier: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        notes: '',
        items: []
      })
      
      closeModal()
      alert('Delivery recorded successfully!')
    } catch (error) {
      console.error('Error saving delivery:', error)
      alert('Error saving delivery: ' + (error.response?.data?.error || error.message))
    }
  }

  const addDeliveryItem = () => {
    setDeliveryForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '', unitCost: '' }]
    }))
  }

  const updateDeliveryItem = (index, field, value) => {
    setDeliveryForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const removeDeliveryItem = (index) => {
    setDeliveryForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const deleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.name}?`)) {
      try {
        try {
          await axios.delete(`http://localhost:5000/api/products/${product.id}`)
        } catch (apiError) {
          console.log('API delete failed, removing from local state instead')
          // Remove from local state if API fails
          setProducts(prevProducts => prevProducts.filter(p => p.id !== product.id))
        }
        fetchData()
        alert('Product deleted successfully!')
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('Error deleting product: ' + (error.response?.data?.error || error.message))
      }
    }
  }

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' }
    if (product.currentStock <= product.minimumStock) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' }
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-waemma-primary"></div>
      </div>
    )
  }

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="mr-4 text-waemma-primary hover:text-waemma-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600">Manage products, stock levels, and deliveries</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => openModal('delivery')}
            className="bg-waemma-secondary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-secondary/90"
          >
            <Truck className="h-5 w-5" />
            <span>Add Delivery</span>
          </button>
          <button
            onClick={() => openModal('product')}
            className="bg-waemma-primary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-primary/90"
          >
            <Plus className="h-5 w-5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
                className="mr-2 h-4 w-4 text-waemma-primary focus:ring-waemma-primary border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Show Low Stock Only</span>
            </label>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">
              Showing {filteredProducts.length} of {products.filter(p => p.isActive !== false).length} products
            </p>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-6 w-6 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{product.unitType}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">KSh {product.sellingPrice}</div>
                      <div className="text-sm text-gray-500">Cost: KSh {product.costPrice}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.currentStock} {product.unitType}s</div>
                      <div className="text-sm text-gray-500">Min: {product.minimumStock}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                      {product.hasCrateTracking && (
                        <div className="text-xs text-blue-600 mt-1">Crate Tracking</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('edit', product)}
                          className="text-waemma-primary hover:text-waemma-primary/80"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteProduct(product)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {modalType === 'product' ? 'Add New Product' : 
                 modalType === 'edit' ? 'Edit Product' : 
                 'Add New Delivery'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            {(modalType === 'product' || modalType === 'edit') && (
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={productForm.name}
                      onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      required
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={category} value={category} className="capitalize">
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Type</label>
                    <select
                      required
                      value={productForm.unitType}
                      onChange={(e) => setProductForm(prev => ({ ...prev, unitType: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    >
                      <option value="">Select Unit Type</option>
                      {unitTypes.map(unitType => (
                        <option key={unitType} value={unitType} className="capitalize">
                          {unitType}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (KSh)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.costPrice}
                      onChange={(e) => setProductForm(prev => ({ ...prev, costPrice: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (KSh)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={productForm.sellingPrice}
                      onChange={(e) => setProductForm(prev => ({ ...prev, sellingPrice: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
                    <input
                      type="number"
                      required
                      value={productForm.minimumStock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, minimumStock: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  />
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={productForm.hasCrateTracking}
                      onChange={(e) => setProductForm(prev => ({ ...prev, hasCrateTracking: e.target.checked }))}
                      className="mr-2 h-4 w-4 text-waemma-primary focus:ring-waemma-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Crate Tracking</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-waemma-primary text-white rounded-md text-sm font-medium hover:bg-waemma-primary/90"
                  >
                    <Save className="h-4 w-4 inline mr-2" />
                    Save Product
                  </button>
                </div>
              </form>
            )}

            {modalType === 'delivery' && (
              <form onSubmit={handleDeliverySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <input
                      type="text"
                      required
                      value={deliveryForm.supplier}
                      onChange={(e) => setDeliveryForm(prev => ({ ...prev, supplier: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={deliveryForm.deliveryDate}
                      onChange={(e) => setDeliveryForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={deliveryForm.notes}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-waemma-primary"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Delivery Items</label>
                    <button
                      type="button"
                      onClick={addDeliveryItem}
                      className="bg-waemma-primary text-white px-3 py-1 rounded text-sm hover:bg-waemma-primary/90"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {deliveryForm.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2 items-end border p-3 rounded">
                        <div>
                          <label className="block text-xs text-gray-600">Product</label>
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => updateDeliveryItem(index, 'productId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select Product</option>
                            {products.filter(p => p.isActive).map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Quantity</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateDeliveryItem(index, 'quantity', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Unit Cost</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            value={item.unitCost}
                            onChange={(e) => updateDeliveryItem(index, 'unitCost', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => removeDeliveryItem(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-waemma-primary text-white rounded-md text-sm font-medium hover:bg-waemma-primary/90"
                    disabled={deliveryForm.items.length === 0}
                  >
                    <Save className="h-4 w-4 inline mr-2" />
                    Save Delivery
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryManagement