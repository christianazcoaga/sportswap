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

// Get messages for a match
router.get('/:matchId', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const db = getDb();

    // Check if user is part of the match
    db.get(
      'SELECT user1_id, user2_id FROM matches WHERE id = ?',
      [matchId],
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
            message: 'No tienes permisos para ver estos mensajes'
          });
        }

        // Get messages
        db.all(
          `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.match_id = ?
           ORDER BY m.created_at ASC`,
          [matchId],
          (err, messages) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error al obtener mensajes'
              });
            }

            res.json({
              success: true,
              messages
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

// Send a message
router.post('/:matchId', authenticateToken, (req, res) => {
  try {
    const { matchId } = req.params;
    const { content } = req.body;
    const db = getDb();

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El mensaje no puede estar vacío'
      });
    }

    // Check if user is part of the match
    db.get(
      'SELECT user1_id, user2_id FROM matches WHERE id = ?',
      [matchId],
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
            message: 'No tienes permisos para enviar mensajes en este match'
          });
        }

        // Create message
        db.run(
          'INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)',
          [matchId, req.user.userId, content.trim()],
          function(err) {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error al enviar mensaje'
              });
            }

            // Get the created message with sender info
            db.get(
              `SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
               FROM messages m
               JOIN users u ON m.sender_id = u.id
               WHERE m.id = ?`,
              [this.lastID],
              (err, message) => {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: 'Error al obtener mensaje'
                  });
                }

                res.status(201).json({
                  success: true,
                  message: 'Mensaje enviado exitosamente',
                  data: message
                });
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

// Delete a message
router.delete('/:matchId/:messageId', authenticateToken, (req, res) => {
  try {
    const { matchId, messageId } = req.params;
    const db = getDb();

    // Check if user is part of the match
    db.get(
      'SELECT user1_id, user2_id FROM matches WHERE id = ?',
      [matchId],
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
            message: 'No tienes permisos para eliminar mensajes en este match'
          });
        }

        // Check if message exists and belongs to user
        db.get(
          'SELECT sender_id FROM messages WHERE id = ? AND match_id = ?',
          [messageId, matchId],
          (err, message) => {
            if (err) {
              return res.status(500).json({
                success: false,
                message: 'Error en el servidor'
              });
            }

            if (!message) {
              return res.status(404).json({
                success: false,
                message: 'Mensaje no encontrado'
              });
            }

            if (message.sender_id !== req.user.userId) {
              return res.status(403).json({
                success: false,
                message: 'Solo puedes eliminar tus propios mensajes'
              });
            }

            // Delete message
            db.run(
              'DELETE FROM messages WHERE id = ?',
              [messageId],
              function(err) {
                if (err) {
                  return res.status(500).json({
                    success: false,
                    message: 'Error al eliminar mensaje'
                  });
                }

                res.json({
                  success: true,
                  message: 'Mensaje eliminado exitosamente'
                });
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

module.exports = router; 