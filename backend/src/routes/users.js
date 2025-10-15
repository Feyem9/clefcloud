import express from 'express';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Récupérer le profil utilisateur
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    logger.error('Get user error', error);
    next(error);
  }
});

// Récupérer les partitions d'un utilisateur
router.get('/:id/partitions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(
      `SELECT * FROM partitions 
       WHERE created_by = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      success: true,
      partitions: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    logger.error('Get user partitions error', error);
    next(error);
  }
});

// Mettre à jour le profil utilisateur
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await query(
      `UPDATE users 
       SET name = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, email, name, created_at, updated_at`,
      [name, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info('User updated', { id });

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    logger.error('Update user error', error);
    next(error);
  }
});

export default router;
