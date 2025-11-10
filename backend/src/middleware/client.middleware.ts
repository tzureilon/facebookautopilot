import { Response, NextFunction } from 'express';
import ClientModel from '../models/Client.model';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware to validate that a client belongs to the authenticated user
 * Expects clientId in req.query, req.body, or req.params
 */
export const validateClientAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    // Get clientId from various possible locations
    const clientId = req.body.clientId || req.query.clientId || req.params.clientId;

    // If no clientId is provided, skip validation (optional clientId)
    if (!clientId) {
      return next();
    }

    // Verify the client belongs to the user
    const client = await ClientModel.findOne({
      _id: clientId,
      agencyUserId: userId,
    });

    if (!client) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid client',
      });
    }

    // Attach client to request for use in controllers
    req.client = client;

    next();
  } catch (error: any) {
    console.error('Error validating client access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate client access',
      error: error.message,
    });
  }
};

/**
 * Middleware to require clientId in request
 * Use this when clientId is mandatory
 */
export const requireClientId = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const clientId = req.body.clientId || req.query.clientId || req.params.clientId;

  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Client ID is required',
    });
  }

  next();
};

/**
 * Middleware to check if user is an agency user
 */
export const requireAgencyUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    // Import User model dynamically to avoid circular dependencies
    const UserModel = (await import('../models/User.model')).default;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isAgency) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Agency account required',
      });
    }

    next();
  } catch (error: any) {
    console.error('Error checking agency status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify agency status',
      error: error.message,
    });
  }
};
