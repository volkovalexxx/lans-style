import fs from 'fs';
import path from 'path';

const FILE = path.join(__dirname, '..', '..', 'uploads', '.site-settings.json');

interface SiteSettings {
  maintenanceMode: boolean;
}

const defaults: SiteSettings = { maintenanceMode: false };

export function getSiteSettings(): SiteSettings {
  try {
    if (fs.existsSync(FILE)) return { ...defaults, ...JSON.parse(fs.readFileSync(FILE, 'utf-8')) };
  } catch {}
  return { ...defaults };
}

export function saveSiteSettings(s: Partial<SiteSettings>): SiteSettings {
  const current = getSiteSettings();
  const next = { ...current, ...s };
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(next, null, 2));
  return next;
}
