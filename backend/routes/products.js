const express = require('express');
const { Product, DeliveryItem, SaleItem, sequelize } = require('../models');
const { requireAuth } = require('./auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get all products
router.get('/', requireAuth, async (req, res) => {
  try {
    const { category, search, lowStock } = req.query;
    
    let whereClause = { isActive: true };
    
    // Filter by category
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // Search by name
    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }
    
    // Filter low stock items
    if (lowStock === 'true') {
      whereClause.currentStock = {
        [Op.lte]: sequelize.col('minimumStock')
      };
    }
    
    const products = await Product.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new product
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      name,
      category,
      unitType,
      costPrice,
      sellingPrice,
      currentStock,
      minimumStock,
      description,
      barcode,
      hasCrateTracking
    } = req.body;

    // Validate required fields
    if (!name || !category || !unitType || !costPrice || !sellingPrice) {
      return res.status(400).json({
        error: 'Name, category, unit type, cost price, and selling price are required'
      });
    }

    // Validate prices
    if (parseFloat(costPrice) < 0 || parseFloat(sellingPrice) < 0) {
      return res.status(400).json({
        error: 'Prices must be non-negative'
      });
    }

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await Product.findOne({ where: { barcode } });
      if (existingProduct) {
        return res.status(409).json({ error: 'Barcode already exists' });
      }
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      unitType,
      costPrice: parseFloat(costPrice),
      sellingPrice: parseFloat(sellingPrice),
      currentStock: parseInt(currentStock) || 0,
      minimumStock: parseInt(minimumStock) || 10,
      description: description?.trim(),
      barcode: barcode?.trim(),
      hasCrateTracking: hasCrateTracking || false
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      name,
      category,
      unitType,
      costPrice,
      sellingPrice,
      minimumStock,
      description,
      barcode,
      hasCrateTracking,
      isActive
    } = req.body;

    // Validate prices if provided
    if (costPrice !== undefined && parseFloat(costPrice) < 0) {
      return res.status(400).json({ error: 'Cost price must be non-negative' });
    }
    
    if (sellingPrice !== undefined && parseFloat(sellingPrice) < 0) {
      return res.status(400).json({ error: 'Selling price must be non-negative' });
    }

    // Check if barcode already exists (excluding current product)
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await Product.findOne({ 
        where: { 
          barcode,
          id: { [Op.ne]: product.id }
        }
      });
      if (existingProduct) {
        return res.status(409).json({ error: 'Barcode already exists' });
      }
    }

    // Update product
    await product.update({
      name: name?.trim() || product.name,
      category: category || product.category,
      unitType: unitType || product.unitType,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : product.costPrice,
      sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : product.sellingPrice,
      minimumStock: minimumStock !== undefined ? parseInt(minimumStock) : product.minimumStock,
      description: description !== undefined ? description?.trim() : product.description,
      barcode: barcode !== undefined ? barcode?.trim() : product.barcode,
      hasCrateTracking: hasCrateTracking !== undefined ? hasCrateTracking : product.hasCrateTracking,
      isActive: isActive !== undefined ? isActive : product.isActive
    });

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product (soft delete)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product has any transactions
    const hasTransactions = await Promise.all([
      SaleItem.findOne({ where: { productId: product.id } }),
      DeliveryItem.findOne({ where: { productId: product.id } })
    ]);

    if (hasTransactions.some(Boolean)) {
      // Soft delete if has transactions
      await product.update({ isActive: false });
      res.json({ message: 'Product deactivated successfully' });
    } else {
      // Hard delete if no transactions
      await product.destroy();
      res.json({ message: 'Product deleted successfully' });
    }

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product categories
router.get('/meta/categories', requireAuth, async (req, res) => {
  try {
    const categories = [
      'beer', 'wine', 'vodka', 'gin', 'whiskey', 
      'rum', 'brandy', 'champagne', 'other'
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unit types
router.get('/meta/unit-types', requireAuth, async (req, res) => {
  try {
    const unitTypes = ['crate', 'carton', 'bottle', 'piece', 'case'];
    
    res.json(unitTypes);
  } catch (error) {
    console.error('Get unit types error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;