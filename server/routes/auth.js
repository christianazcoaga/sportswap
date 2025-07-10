const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const db = getDb();

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    // Check if user exists
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error en el servidor'
        });
      }

      if (user) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      db.run(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name],
        function(err) {
          if (err) {
            return res.status(500).json({
              success: false,
              message: 'Error al crear usuario'
            });
          }

          // Generate token
          const token = jwt.sign(
            { userId: this.lastID, email },
            require('../config').jwtSecret,
            { expiresIn: '7d' }
          );

          res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            user: {
              id: this.lastID,
              email,
              name
            }
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

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const db = getDb();

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    // Find user
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Error en el servidor'
        });
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        require('../config').jwtSecret,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          location: user.location
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
});

// Get current user
router.get('/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const decoded = jwt.verify(token, require('../config').jwtSecret);
    const db = getDb();

    db.get('SELECT id, email, name, avatar, bio, location FROM users WHERE id = ?', 
      [decoded.userId], (err, user) => {
        if (err || !user) {
          return res.status(401).json({
            success: false,
            message: 'Usuario no encontrado'
          });
        }

        res.json({
          success: true,
          user
        });
      });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

module.exports = router; 