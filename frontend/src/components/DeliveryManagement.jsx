import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Truck, 
  Package, 
  Calendar, 
  User, 
  Plus, 
  Minus, 
  Save,
  X,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDelivery, setShowNewDelivery] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [suppliers, setSuppliers] = useState(['Diamond Distributors', 'Kenya Breweries', 'Coca Cola Distributors', 'Wine & Spirits Ltd']);
  
  // Delivery form state
  const [deliveryForm, setDeliveryForm] = useState({
    supplier: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [],
    crateTracking: {
      fullCratesDelivered: 0,
      emptyCratesReturned: 0
    }
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Try to fetch from API
      try {
        const [deliveriesRes, productsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/deliveries'),
          axios.get('http://localhost:5000/api/products')
        ]);
        
        if (deliveriesRes.data && deliveriesRes.data.length > 0) {
          setDeliveries(deliveriesRes.data);
        } else {
          // Use mock data if API returns empty
          setDeliveries(getMockDeliveries());
        }
        
        if (productsRes.data && productsRes.data.length > 0) {
          setProducts(productsRes.data);
        } else {
          // Use mock data if API returns empty
          setProducts(getMockProducts());
        }
      } catch (error) {
        console.error('API fetch failed, using mock data', error);
        setDeliveries(getMockDeliveries());
        setProducts(getMockProducts());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMockDeliveries = () => {
    return [
      {
        id: 1,
        supplier: 'Diamond Distributors',
        deliveryDate: new Date().toISOString(),
        notes: 'Regular weekly delivery',
        items: [
          { productName: 'Diamond Ice Beer', quantity: 10, unitCost: 2200 }
        ],
        crateTracking: {
          fullCratesDelivered: 10,
          emptyCratesReturned: 8
        },
        total: 22000
      },
      {
        id: 2,
        supplier: 'Kenya Breweries',
        deliveryDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: 'Monthly stock replenishment',
        items: [
          { productName: 'Tusker Lager', quantity: 50, unitCost: 150 }
        ],
        total: 7500
      },
      {
        id: 3,
        supplier: 'Wine & Spirits Ltd',
        deliveryDate: new Date(Date.now() - 86400000 * 7).toISOString(),
        notes: 'Special order for weekend',
        items: [
          { productName: 'Johnnie Walker Black', quantity: 5, unitCost: 3500 },
          { productName: 'Four Cousins Wine', quantity: 10, unitCost: 850 }
        ],
        total: 26000
      }
    ];
  };

  const getMockProducts = () => {
    return [
      { id: 1, name: 'Diamond Ice Beer', category: 'Beer', unitType: 'Crate', costPrice: 2200, sellingPrice: 2500, currentStock: 15, hasCrateTracking: true },
      { id: 2, name: 'Tusker Lager', category: 'Beer', unitType: 'Bottle', costPrice: 150, sellingPrice: 200, currentStock: 48 },
      { id: 3, name: 'Johnnie Walker Black', category: 'Spirits', unitType: 'Bottle', costPrice: 3500, sellingPrice: 4200, currentStock: 5 },
      { id: 4, name: 'Coca Cola', category: 'Soft Drinks', unitType: 'Crate', costPrice: 800, sellingPrice: 1000, currentStock: 8 },
      { id: 5, name: 'Four Cousins Wine', category: 'Wine', unitType: 'Bottle', costPrice: 850, sellingPrice: 1100, currentStock: 12 }
    ];
  };

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    try {
      // Calculate total
      const total = deliveryForm.items.reduce(
        (sum, item) => sum + (parseFloat(item.unitCost) * parseInt(item.quantity)), 0
      );
      
      const newDelivery = {
        ...deliveryForm,
        total,
        id: deliveries.length + 1,
        createdAt: new Date().toISOString()
      };
      
      try {
        // Try API first
        await axios.post('http://localhost:5000/api/deliveries', newDelivery);
      } catch (apiError) {
        console.log('API delivery creation failed, updating local state instead');
        // Update local state if API fails
        setDeliveries([newDelivery, ...deliveries]);
        
        // Update product stock
        const updatedProducts = [...products];
        deliveryForm.items.forEach(item => {
          const productIndex = updatedProducts.findIndex(p => p.id === parseInt(item.productId));
          if (productIndex !== -1) {
            updatedProducts[productIndex].currentStock += parseInt(item.quantity);
          }
        });
        setProducts(updatedProducts);
      }
      
      setShowNewDelivery(false);
      resetDeliveryForm();
      fetchData();
      alert('Delivery recorded successfully!');
    } catch (error) {
      console.error('Error saving delivery:', error);
      alert('Error saving delivery: ' + error.message);
    }
  };

  const resetDeliveryForm = () => {
    setDeliveryForm({
      supplier: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
      crateTracking: {
        fullCratesDelivered: 0,
        emptyCratesReturned: 0
      }
    });
  };

  const addDeliveryItem = () => {
    setDeliveryForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: '', unitCost: '' }]
    }));
  };

  const updateDeliveryItem = (index, field, value) => {
    setDeliveryForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
    
    // If product is selected, auto-fill the unit cost
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        setDeliveryForm(prev => ({
          ...prev,
          items: prev.items.map((item, i) => 
            i === index ? { 
              ...item, 
              unitCost: product.costPrice.toString(),
              productName: product.name,
              hasCrateTracking: product.hasCrateTracking || false
            } : item
          )
        }));
      }
    }
  };

  const removeDeliveryItem = (index) => {
    setDeliveryForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateCrateTracking = (field, value) => {
    setDeliveryForm(prev => ({
      ...prev,
      crateTracking: {
        ...prev.crateTracking,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const viewDeliveryDetails = (delivery) => {
    setSelectedDelivery(delivery);
    setShowDeliveryDetails(true);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeliveries = deliveries.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(deliveries.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-waemma-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Management</h1>
          <p className="text-gray-600">Record and track product deliveries and crate returns</p>
        </div>
        <button
          onClick={() => setShowNewDelivery(true)}
          className="bg-waemma-primary text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2 hover:bg-waemma-primary/90"
        >
          <Truck className="h-5 w-5" />
          <span>Record New Delivery</span>
        </button>
      </div>

      {/* Delivery List */}
      {!showNewDelivery && !showDeliveryDetails && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Deliveries</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(delivery.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.items.length} {delivery.items.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      KSh {delivery.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {delivery.crateTracking ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          +{delivery.crateTracking.fullCratesDelivered || 0} / 
                          -{delivery.crateTracking.emptyCratesReturned || 0}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewDeliveryDetails(delivery)}
                        className="text-waemma-primary hover:text-waemma-primary/80 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {indexOfLastItem > deliveries.length ? deliveries.length : indexOfLastItem}
                    </span>{' '}
                    of <span className="font-medium">{deliveries.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => paginate(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? 'z-10 bg-waemma-primary text-white border-waemma-primary'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages 
                          ? 'text-gray-300 cursor-not-allowed' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Delivery Form */}
      {showNewDelivery && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Record New Delivery</h2>
            <button
              onClick={() => {
                setShowNewDelivery(false);
                resetDeliveryForm();
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleDeliverySubmit} className="p-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <select
                  value={deliveryForm.supplier}
                  onChange={(e) => setDeliveryForm({...deliveryForm, supplier: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((supplier, index) => (
                    <option key={index} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryForm.deliveryDate}
                  onChange={(e) => setDeliveryForm({...deliveryForm, deliveryDate: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={deliveryForm.notes}
                onChange={(e) => setDeliveryForm({...deliveryForm, notes: e.target.value})}
                rows={2}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary"
                placeholder="Optional delivery notes"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-700">Delivery Items</h3>
                <button
                  type="button"
                  onClick={addDeliveryItem}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-waemma-primary bg-waemma-primary/10 hover:bg-waemma-primary/20"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>
              
              {deliveryForm.items.length === 0 ? (
                <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
                  No items added. Click "Add Item" to start.
                </div>
              ) : (
                <div className="space-y-3">
                  {deliveryForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Product
                          </label>
                          <select
                            value={item.productId}
                            onChange={(e) => updateDeliveryItem(index, 'productId', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary text-sm"
                            required
                          >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} ({product.unitType})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateDeliveryItem(index, 'quantity', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary text-sm"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Unit Cost (KSh)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => updateDeliveryItem(index, 'unitCost', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary text-sm"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeDeliveryItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Diamond Ice Crate Tracking */}
            {deliveryForm.items.some(item => {
              const product = products.find(p => p.id === parseInt(item.productId));
              return product && product.hasCrateTracking;
            }) && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-3">Diamond Ice Crate Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Crates Delivered
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deliveryForm.crateTracking.fullCratesDelivered}
                      onChange={(e) => updateCrateTracking('fullCratesDelivered', e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Empty Crates Returned
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={deliveryForm.crateTracking.emptyCratesReturned}
                      onChange={(e) => updateCrateTracking('emptyCratesReturned', e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-waemma-primary focus:border-waemma-primary"
                    />
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center text-blue-800">
                    <Package className="h-5 w-5 mr-2" />
                    <span className="font-medium">Crate Balance:</span>
                    <span className="ml-2">
                      {deliveryForm.crateTracking.fullCratesDelivered - deliveryForm.crateTracking.emptyCratesReturned}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    This represents the number of crates the customer will need to return in the future.
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowNewDelivery(false);
                  resetDeliveryForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deliveryForm.items.length === 0}
                className={`px-4 py-2 rounded-md text-white font-medium flex items-center ${
                  deliveryForm.items.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-waemma-primary hover:bg-waemma-primary/90'
                }`}
              >
                <Save className="h-5 w-5 mr-1" />
                Save Delivery
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Delivery Details */}
      {showDeliveryDetails && selectedDelivery && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Delivery Details</h2>
            <button
              onClick={() => {
                setShowDeliveryDetails(false);
                setSelectedDelivery(null);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Supplier</h3>
                <p className="mt-1 text-lg">{selectedDelivery.supplier}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Delivery Date</h3>
                <p className="mt-1 text-lg">
                  {new Date(selectedDelivery.deliveryDate).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="mt-1 text-lg font-semibold text-waemma-primary">
                  KSh {selectedDelivery.total.toLocaleString()}
                </p>
              </div>
              
              {selectedDelivery.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1">{selectedDelivery.notes}</p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Delivery Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedDelivery.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          KSh {parseFloat(item.unitCost).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          KSh {(parseFloat(item.unitCost) * parseInt(item.quantity)).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedDelivery.crateTracking && (
              <div className="border-t pt-4">
                <h3 className="text-md font-medium text-gray-700 mb-3">Diamond Ice Crate Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Full Crates Delivered</div>
                    <div className="mt-1 text-2xl font-bold text-blue-700">
                      {selectedDelivery.crateTracking.fullCratesDelivered || 0}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Empty Crates Returned</div>
                    <div className="mt-1 text-2xl font-bold text-green-700">
                      {selectedDelivery.crateTracking.emptyCratesReturned || 0}
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Crate Balance</div>
                    <div className="mt-1 text-2xl font-bold text-yellow-700">
                      {(selectedDelivery.crateTracking.fullCratesDelivered || 0) - 
                       (selectedDelivery.crateTracking.emptyCratesReturned || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDeliveryDetails(false);
                  setSelectedDelivery(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryManagement;