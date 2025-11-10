import { Response } from 'express';
import { ClientRequest } from '../middleware/clientContext.middleware';
import Questionnaire from '../models/Questionnaire.model';
import logger from '../utils/logger';

export class QuestionnaireController {
  /**
   * Create new questionnaire
   */
  async create(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;
      const questionnaireData = req.body;

      const questionnaire = await Questionnaire.create({
        ...questionnaireData,
        userId,
        clientId,
        status: 'draft',
      });

      logger.info(`Questionnaire created: ${questionnaire._id}`);

      res.status(201).json(questionnaire);
    } catch (error: any) {
      logger.error('Create questionnaire error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all questionnaires for user
   */
  async getAll(req: ClientRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { userId };
      if (clientId) query.clientId = clientId;

      const questionnaires = await Questionnaire.find(query).sort({ createdAt: -1 });

      res.json(questionnaires);
    } catch (error: any) {
      logger.error('Get questionnaires error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get questionnaire by ID
   */
  async getById(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const questionnaire = await Questionnaire.findOne(query);

      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      res.json(questionnaire);
    } catch (error: any) {
      logger.error('Get questionnaire error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update questionnaire
   */
  async update(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;
      const updates = req.body;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const questionnaire = await Questionnaire.findOneAndUpdate(
        query,
        { ...updates, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      logger.info(`Questionnaire updated: ${questionnaire._id}`);

      res.json(questionnaire);
    } catch (error: any) {
      logger.error('Update questionnaire error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Submit questionnaire
   */
  async submit(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const questionnaire = await Questionnaire.findOneAndUpdate(
        query,
        { status: 'submitted', updatedAt: new Date() },
        { new: true }
      );

      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      logger.info(`Questionnaire submitted: ${questionnaire._id}`);

      res.json(questionnaire);
    } catch (error: any) {
      logger.error('Submit questionnaire error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete questionnaire
   */
  async delete(req: ClientRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const clientId = req.clientId;

      const query: any = { _id: id, userId };
      if (clientId) query.clientId = clientId;

      const questionnaire = await Questionnaire.findOneAndDelete(query);

      if (!questionnaire) {
        res.status(404).json({ error: 'Questionnaire not found' });
        return;
      }

      logger.info(`Questionnaire deleted: ${id}`);

      res.json({ message: 'Questionnaire deleted successfully' });
    } catch (error: any) {
      logger.error('Delete questionnaire error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Upload creative asset
   */
  async uploadAsset(req: ClientRequest, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      const asset = {
        id: file.filename,
        type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        url: `/uploads/${file.filename}`,
        filename: file.originalname,
        size: file.size,
      };

      logger.info(`Asset uploaded: ${file.filename}`);

      res.json(asset);
    } catch (error: any) {
      logger.error('Upload asset error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export default new QuestionnaireController();
