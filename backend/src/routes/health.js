import express from 'express';
import pool from '../config/database.js';
import { s3Client } from '../config/aws.js';
import { ListBucketsCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'OK',
    services: {
      database: 'unknown',
      s3: 'unknown'
    }
  };

  try {
    // Check database
    await pool.query('SELECT 1');
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'DEGRADED';
  }

  try {
    // Check S3
    await s3Client.send(new ListBucketsCommand({}));
    health.services.s3 = 'connected';
  } catch (error) {
    health.services.s3 = 'disconnected';
    health.status = 'DEGRADED';
  }

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
