const express = require('express');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
    }
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, require('../config').jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

// Create product
router.post('/', authenticateToken, upload.array('images', 5), (req, res) => {
  try {
    const { title, description, category, condition } = req.body;
    const db = getDb();

    if (!title || !category || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Título, categoría y condición son requeridos'
      });
    }

    const images = req.files ? req.files.map(file => file.filename).join(',') : '';

    db.run(
      'INSERT INTO products (user_id, title, description, category, condition, images) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.userId, title, description, category, condition, images],
      function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al crear producto'
          });
        }

        res.status(201).json({
          success: true,
          message: 'Producto creado exitosamente',
          productId: this.lastID
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Get all products (for discovery)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.name as user_name, u.avatar as user_avatar
      FROM products p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id != ?
    `;
    let params = [req.user.userId];

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    db.all(query, params, (err, products) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al obtener productos'
        });
      }

      // Parse images for each product
      const productsWithImages = products.map(product => ({
        ...product,
        images: product.images ? product.images.split(',') : []
      }));

      res.json({
        success: true,
        products: productsWithImages,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Get user's products
router.get('/my-products', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    db.all(
      'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.userId],
      (err, products) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al obtener productos'
          });
        }

        const productsWithImages = products.map(product => ({
          ...product,
          images: product.images ? product.images.split(',') : []
        }));

        res.json({
          success: true,
          products: productsWithImages
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Get single product
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.get(
      `SELECT p.*, u.name as user_name, u.avatar as user_avatar, u.bio as user_bio
       FROM products p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ?`,
      [id],
      (err, product) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al obtener producto'
          });
        }

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
          });
        }

        product.images = product.images ? product.images.split(',') : [];

        res.json({
          success: true,
          product
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Update product
router.put('/:id', authenticateToken, upload.array('images', 5), (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, condition } = req.body;
    const db = getDb();

    // Check if product belongs to user
    db.get('SELECT user_id FROM products WHERE id = ?', [id], (err, product) => {
      if (err || !product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (product.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para editar este producto'
        });
      }

      const images = req.files ? req.files.map(file => file.filename).join(',') : '';

      db.run(
        'UPDATE products SET title = ?, description = ?, category = ?, condition = ?, images = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, description, category, condition, images, id],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error al actualizar producto'
            });
          }

          res.json({
            success: true,
            message: 'Producto actualizado exitosamente'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Delete product
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Check if product belongs to user
    db.get('SELECT user_id FROM products WHERE id = ?', [id], (err, product) => {
      if (err || !product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (product.user_id !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para eliminar este producto'
        });
      }

      db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al eliminar producto'
          });
        }

        res.json({
          success: true,
          message: 'Producto eliminado exitosamente'
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

module.exports = router; 