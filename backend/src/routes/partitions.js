import express from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, AWS_CONFIG } from '../config/aws.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Configuration Multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG are allowed.'));
    }
  }
});

// Upload d'une partition
router.post('/upload',
  upload.single('file'),
  [
    body('title').trim().notEmpty(),
    body('composer').optional().trim(),
    body('key').optional().trim(),
    body('category').isIn(['messe', 'concert', 'autre']),
    body('messePart').optional().trim(),
    body('tags').optional(),
    body('userId').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const { title, composer, key, category, messePart, tags, userId } = req.body;
      const file = req.file;

      // Nettoyer le nom du fichier
      const cleanTitle = title
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}_${cleanTitle}.${fileExtension}`;
      const filePath = `partitions/${userId}/${fileName}`;

      // Upload vers S3
      const uploadCommand = new PutObjectCommand({
        Bucket: AWS_CONFIG.s3.bucketName,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          title,
          category,
          uploadedBy: userId
        }
      });

      await s3Client.send(uploadCommand);

      // URL publique
      const downloadURL = `https://${AWS_CONFIG.s3.bucketName}.s3.${AWS_CONFIG.s3.region}.amazonaws.com/${filePath}`;

      // Sauvegarder dans la base de données
      const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];
      const result = await query(
        `INSERT INTO partitions 
         (title, composer, key, category, messe_part, tags, storage_path, download_url, file_size, file_type, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          title,
          composer || null,
          key || null,
          category,
          category === 'messe' ? messePart : null,
          tagsArray,
          filePath,
          downloadURL,
          file.size,
          file.mimetype,
          userId
        ]
      );

      logger.info('Partition uploaded', { title, userId, filePath });

      res.status(201).json({
        success: true,
        message: 'Partition uploaded successfully',
        partition: result.rows[0]
      });
    } catch (error) {
      logger.error('Upload error', error);
      next(error);
    }
  }
);

// Récupérer toutes les partitions
router.get('/', async (req, res, next) => {
  try {
    const { category, search, limit = 50, offset = 0 } = req.query;

    let queryText = 'SELECT * FROM partitions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (category) {
      queryText += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (title ILIKE $${paramCount} OR composer ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    res.json({
      success: true,
      partitions: result.rows,
      count: result.rowCount
    });
  } catch (error) {
    logger.error('Get partitions error', error);
    next(error);
  }
});

// Récupérer une partition par ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM partitions WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partition not found'
      });
    }

    res.json({
      success: true,
      partition: result.rows[0]
    });
  } catch (error) {
    logger.error('Get partition error', error);
    next(error);
  }
});

// Générer une URL signée pour téléchargement
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT storage_path FROM partitions WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partition not found'
      });
    }

    const storagePath = result.rows[0].storage_path;

    const command = new GetObjectCommand({
      Bucket: AWS_CONFIG.s3.bucketName,
      Key: storagePath,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      success: true,
      downloadUrl: signedUrl,
      expiresIn: 3600
    });
  } catch (error) {
    logger.error('Generate download URL error', error);
    next(error);
  }
});

// Supprimer une partition
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Récupérer la partition
    const partitionResult = await query(
      'SELECT * FROM partitions WHERE id = $1',
      [id]
    );

    if (partitionResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Partition not found'
      });
    }

    const partition = partitionResult.rows[0];

    // Vérifier que l'utilisateur est le propriétaire
    if (partition.created_by !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this partition'
      });
    }

    // Supprimer de S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: AWS_CONFIG.s3.bucketName,
      Key: partition.storage_path,
    });

    await s3Client.send(deleteCommand);

    // Supprimer de la base de données
    await query('DELETE FROM partitions WHERE id = $1', [id]);

    logger.info('Partition deleted', { id, userId });

    res.json({
      success: true,
      message: 'Partition deleted successfully'
    });
  } catch (error) {
    logger.error('Delete partition error', error);
    next(error);
  }
});

export default router;
