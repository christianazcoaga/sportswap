const express = require('express');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const router = express.Router();

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

// Swipe on a product (like/dislike)
router.post('/:productId', authenticateToken, (req, res) => {
  try {
    const { productId } = req.params;
    const { action } = req.body; // 'like' or 'dislike'
    const db = getDb();

    if (!action || !['like', 'dislike'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Acción debe ser "like" o "dislike"'
      });
    }

    // Check if product exists and doesn't belong to user
    db.get(
      'SELECT user_id FROM products WHERE id = ?',
      [productId],
      (err, product) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error en el servidor'
          });
        }

        if (!product) {
          return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
          });
        }

        if (product.user_id === req.user.userId) {
          return res.status(400).json({
            success: false,
            message: 'No puedes hacer swipe en tu propio producto'
          });
        }

        // Check if already swiped
        db.get(
          'SELECT id FROM swipes WHERE user_id = ? AND product_id = ?',
          [req.user.userId, productId],
          (err, existingSwipe) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
              });
            }

            if (existingSwipe) {
              return res.status(400).json({
                success: false,
                message: 'Ya has hecho swipe en este producto'
              });
            }

            // Create swipe
            db.run(
              'INSERT INTO swipes (user_id, product_id, action) VALUES (?, ?, ?)',
              [req.user.userId, productId, action],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: 'Error al crear swipe'
                  });
                }

                // If it's a like, check for mutual match
                if (action === 'like') {
                  checkForMatch(req.user.userId, productId, product.user_id, res);
                } else {
                  res.json({
                    success: true,
                    message: 'Swipe registrado',
                    action
                  });
                }
              }
            );
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Check for mutual match
const checkForMatch = (userId1, productId1, userId2, res) => {
  const db = getDb();

  // Check if the other user has liked any of user1's products
  db.get(
    `SELECT s.product_id as liked_product_id, p.id as user1_product_id
     FROM swipes s
     JOIN products p ON s.product_id = p.id
     WHERE s.user_id = ? AND s.action = 'like' AND p.user_id = ?`,
    [userId2, userId1],
    (err, mutualLike) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error al verificar match'
        });
      }

      if (mutualLike) {
        // Create match
        db.run(
          `INSERT INTO matches (user1_id, user2_id, product1_id, product2_id)
           VALUES (?, ?, ?, ?)`,
          [userId1, userId2, mutualLike.user1_product_id, productId1],
          function(err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error al crear match'
              });
            }

            res.json({
              success: true,
              message: '¡Match! Ambos están interesados en intercambiar',
              action: 'like',
              match: {
                id: this.lastID,
                user1_id: userId1,
                user2_id: userId2,
                product1_id: mutualLike.user1_product_id,
                product2_id: productId1
              }
            });
          }
        );
      } else {
        res.json({
          success: true,
          message: 'Swipe registrado',
          action: 'like'
        });
      }
    }
  );
};

// Get products for swiping (discovery)
router.get('/discover', authenticateToken, (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const db = getDb();
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, u.name as user_name, u.avatar as user_avatar
      FROM products p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id != ?
      AND p.id NOT IN (
        SELECT product_id FROM swipes WHERE user_id = ?
      )
    `;
    let params = [req.user.userId, req.user.userId];

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

// Get user's swipe history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    db.all(
      `SELECT s.*, p.title, p.category, p.condition, p.images,
              u.name as product_owner_name, u.avatar as product_owner_avatar
       FROM swipes s
       JOIN products p ON s.product_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`,
      [req.user.userId],
      (err, swipes) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al obtener historial'
          });
        }

        const swipesWithImages = swipes.map(swipe => ({
          ...swipe,
          images: swipe.images ? swipe.images.split(',') : []
        }));

        res.json({
          success: true,
          swipes: swipesWithImages
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

module.exports = router; 