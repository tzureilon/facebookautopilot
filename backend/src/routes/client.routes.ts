import { Router } from 'express';
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  toggleClientStatus,
} from '../controllers/client.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/clients
 * @desc    Get all clients for the authenticated user
 * @access  Private
 */
router.get('/', getClients);

/**
 * @route   GET /api/clients/:id
 * @desc    Get a single client by ID
 * @access  Private
 */
router.get('/:id', getClientById);

/**
 * @route   POST /api/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post('/', createClient);

/**
 * @route   PUT /api/clients/:id
 * @desc    Update a client
 * @access  Private
 */
router.put('/:id', updateClient);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete a client
 * @access  Private
 */
router.delete('/:id', deleteClient);

/**
 * @route   GET /api/clients/:id/stats
 * @desc    Get client statistics
 * @access  Private
 */
router.get('/:id/stats', getClientStats);

/**
 * @route   POST /api/clients/:id/toggle-status
 * @desc    Toggle client status (active/inactive)
 * @access  Private
 */
router.post('/:id/toggle-status', toggleClientStatus);

export default router;
