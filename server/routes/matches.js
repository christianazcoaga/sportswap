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

// Get user's matches
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDb();

    db.all(
      `SELECT m.*, 
              p1.title as product1_title, p1.images as product1_images, p1.category as product1_category,
              p2.title as product2_title, p2.images as product2_images, p2.category as product2_category,
              u1.name as user1_name, u1.avatar as user1_avatar,
              u2.name as user2_name, u2.avatar as user2_avatar
       FROM matches m
       JOIN products p1 ON m.product1_id = p1.id
       JOIN products p2 ON m.product2_id = p2.id
       JOIN users u1 ON m.user1_id = u1.id
       JOIN users u2 ON m.user2_id = u2.id
       WHERE m.user1_id = ? OR m.user2_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.userId, req.user.userId],
      (err, matches) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al obtener matches'
          });
        }

        // Parse images for each match
        const matchesWithImages = matches.map(match => ({
          ...match,
          product1_images: match.product1_images ? match.product1_images.split(',') : [],
          product2_images: match.product2_images ? match.product2_images.split(',') : []
        }));

        res.json({
          success: true,
          matches: matchesWithImages
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

// Get single match
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    db.get(
      `SELECT m.*, 
              p1.title as product1_title, p1.description as product1_description, 
              p1.images as product1_images, p1.category as product1_category, p1.condition as product1_condition,
              p2.title as product2_title, p2.description as product2_description,
              p2.images as product2_images, p2.category as product2_category, p2.condition as product2_condition,
              u1.name as user1_name, u1.avatar as user1_avatar, u1.bio as user1_bio,
              u2.name as user2_name, u2.avatar as user2_avatar, u2.bio as user2_bio
       FROM matches m
       JOIN products p1 ON m.product1_id = p1.id
       JOIN products p2 ON m.product2_id = p2.id
       JOIN users u1 ON m.user1_id = u1.id
       JOIN users u2 ON m.user2_id = u2.id
       WHERE m.id = ? AND (m.user1_id = ? OR m.user2_id = ?)`,
      [id, req.user.userId, req.user.userId],
      (err, match) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error al obtener match'
          });
        }

        if (!match) {
          return res.status(404).json({
            success: false,
            message: 'Match no encontrado'
          });
        }

        match.product1_images = match.product1_images ? match.product1_images.split(',') : [];
        match.product2_images = match.product2_images ? match.product2_images.split(',') : [];

        res.json({
          success: true,
          match
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

// Update match status (accept/reject/complete)
router.put('/:id/status', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'rejected', 'completed'
    const db = getDb();

    if (!status || !['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status debe ser "accepted", "rejected" o "completed"'
      });
    }

    // Check if match exists and user is part of it
    db.get(
      'SELECT user1_id, user2_id FROM matches WHERE id = ?',
      [id],
      (err, match) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error en el servidor'
          });
        }

        if (!match) {
          return res.status(404).json({
            success: false,
            message: 'Match no encontrado'
          });
        }

        if (match.user1_id !== req.user.userId && match.user2_id !== req.user.userId) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para modificar este match'
          });
        }

        // Update match status
        db.run(
          'UPDATE matches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [status, id],
          function(err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error al actualizar match'
              });
            }

            res.json({
              success: true,
              message: `Match ${status}`,
              status
            });
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

// Delete match
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Check if match exists and user is part of it
    db.get(
      'SELECT user1_id, user2_id FROM matches WHERE id = ?',
      [id],
      (err, match) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Error en el servidor'
          });
        }

        if (!match) {
          return res.status(404).json({
            success: false,
            message: 'Match no encontrado'
          });
        }

        if (match.user1_id !== req.user.userId && match.user2_id !== req.user.userId) {
          return res.status(403).json({
            success: false,
            message: 'No tienes permisos para eliminar este match'
          });
        }

        // Delete match and related messages
        db.run('DELETE FROM messages WHERE match_id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error al eliminar mensajes'
            });
          }

          db.run('DELETE FROM matches WHERE id = ?', [id], function(err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error al eliminar match'
              });
            }

            res.json({
              success: true,
              message: 'Match eliminado exitosamente'
            });
          });
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