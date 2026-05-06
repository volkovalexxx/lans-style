import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSiteSettings, saveSiteSettings } from '../services/siteSettings';

const router = Router();

router.get('/', (_req, res) => {
  res.json(getSiteSettings());
});

router.put('/', authMiddleware, (req, res) => {
  const { maintenanceMode } = req.body;
  const updated = saveSiteSettings({ maintenanceMode: Boolean(maintenanceMode) });
  res.json(updated);
});

export default router;
