import express from 'express';
import { body, validationResult } from 'express-validator';
import {
  SignUpCommand,
  InitiateAuthCommand,
  ConfirmSignUpCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, AWS_CONFIG } from '../config/aws.js';
import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Inscription
router.post('/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').optional().trim()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password, name } = req.body;

      // Créer l'utilisateur dans Cognito
      const signUpCommand = new SignUpCommand({
        ClientId: AWS_CONFIG.cognito.clientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          ...(name ? [{ Name: 'name', Value: name }] : [])
        ]
      });

      const result = await cognitoClient.send(signUpCommand);

      logger.info('User signed up', { email, sub: result.UserSub });

      res.status(201).json({
        success: true,
        message: 'User created successfully. Please check your email for verification code.',
        userSub: result.UserSub
      });
    } catch (error) {
      logger.error('Signup error', error);
      next(error);
    }
  }
);

// Confirmation d'inscription
router.post('/confirm-signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, code } = req.body;

      const confirmCommand = new ConfirmSignUpCommand({
        ClientId: AWS_CONFIG.cognito.clientId,
        Username: email,
        ConfirmationCode: code
      });

      await cognitoClient.send(confirmCommand);

      logger.info('User confirmed', { email });

      res.json({
        success: true,
        message: 'Email confirmed successfully'
      });
    } catch (error) {
      logger.error('Confirmation error', error);
      next(error);
    }
  }
);

// Connexion
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, password } = req.body;

      const authCommand = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: AWS_CONFIG.cognito.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password
        }
      });

      const result = await cognitoClient.send(authCommand);

      // Créer ou mettre à jour l'utilisateur dans la base de données
      const userResult = await query(
        `INSERT INTO users (cognito_sub, email, name)
         VALUES ($1, $2, $3)
         ON CONFLICT (cognito_sub) DO UPDATE
         SET updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [result.AuthenticationResult.AccessToken, email, email.split('@')[0]]
      );

      logger.info('User logged in', { email });

      res.json({
        success: true,
        tokens: {
          accessToken: result.AuthenticationResult.AccessToken,
          idToken: result.AuthenticationResult.IdToken,
          refreshToken: result.AuthenticationResult.RefreshToken,
          expiresIn: result.AuthenticationResult.ExpiresIn
        },
        user: userResult.rows[0]
      });
    } catch (error) {
      logger.error('Login error', error);
      next(error);
    }
  }
);

// Mot de passe oublié
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email } = req.body;

      const forgotCommand = new ForgotPasswordCommand({
        ClientId: AWS_CONFIG.cognito.clientId,
        Username: email
      });

      await cognitoClient.send(forgotCommand);

      logger.info('Password reset requested', { email });

      res.json({
        success: true,
        message: 'Password reset code sent to your email'
      });
    } catch (error) {
      logger.error('Forgot password error', error);
      next(error);
    }
  }
);

// Confirmer le nouveau mot de passe
router.post('/confirm-forgot-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }),
    body('newPassword').isLength({ min: 8 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { email, code, newPassword } = req.body;

      const confirmCommand = new ConfirmForgotPasswordCommand({
        ClientId: AWS_CONFIG.cognito.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword
      });

      await cognitoClient.send(confirmCommand);

      logger.info('Password reset confirmed', { email });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      logger.error('Confirm forgot password error', error);
      next(error);
    }
  }
);

export default router;
