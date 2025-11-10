import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import logger from '../utils/logger';

export class AuthController {
  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, company } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ error: 'User already exists' });
        return;
      }

      // Create new user
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        company,
      });

      // Generate token
      const token = this.generateToken(user);

      logger.info(`User registered: ${user.email}`);

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({ error: 'Account is disabled' });
        return;
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = this.generateToken(user);

      logger.info(`User logged in: ${user.email}`);

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: any, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user.id).select('-password');

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: any): string {
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    const jwtExpire = process.env.JWT_EXPIRE || '7d';

    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
      },
      jwtSecret,
      { expiresIn: jwtExpire }
    );
  }
}

export default new AuthController();
