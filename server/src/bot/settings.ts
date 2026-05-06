import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(__dirname, '..', '..', 'uploads', '.bot-settings.json');

export interface BotSettings {
  retailChatIds: string[];       // розница
  wholesaleChatIds: string[];    // опт
  feedbackChatIds: string[];     // обратная связь
  adminChatIds: string[];        // кто имеет доступ к управлению ботом (пусто = все)
}

const DEFAULTS: BotSettings = {
  retailChatIds: [],
  wholesaleChatIds: ['7506120714', '213790330'],
  feedbackChatIds: [],
  adminChatIds: [],
};

export function getBotSettings(): BotSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) };
    }
  } catch {}
  return { ...DEFAULTS };
}

export function saveBotSettings(settings: Partial<BotSettings>): BotSettings {
  const current = getBotSettings();
  const next = { ...current, ...settings };
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2));
  return next;
}
