import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ClientModel } from '../models/Client.model';
import logger from '../utils/logger';

export interface ClientRequest extends AuthRequest {
  clientId?: string;
  client?: any;
}

/**
 * Extract client ID from request headers or query
 * This middleware adds clientId to the request object for filtering
 */
export const extractClientContext = async (
  req: ClientRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get clientId from header or query parameter
    const clientId = req.headers['x-client-id'] as string || req.query.clientId as string;

    if (clientId) {
      // Verify client belongs to user
      const client = await ClientModel.findOne({
        _id: clientId,
        userId: req.user?.id,
      });

      if (!client) {
        res.status(403).json({ error: 'Invalid client or access denied' });
        return;
      }

      // Check if client is active
      if (client.status !== 'active') {
        res.status(403).json({ error: 'Client is not active' });
        return;
      }

      req.clientId = clientId;
      req.client = client;
    }

    next();
  } catch (error: any) {
    logger.error('Client context error:', error);
    res.status(500).json({ error: 'Failed to validate client context' });
  }
};

/**
 * Require client context - returns error if no client is selected
 */
export const requireClient = (
  req: ClientRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.clientId) {
    res.status(400).json({ error: 'Client selection required. Please select a client.' });
    return;
  }

  next();
};
