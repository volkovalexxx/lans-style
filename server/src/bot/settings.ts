import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(__dirname, '..', '..', 'uploads', '.bot-settings.json');

interface BotSettings {
  ordersChatId?: string;
  wholesaleChatId?: string;
}

export function getBotSettings(): BotSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

export function saveBotSettings(settings: BotSettings): void {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
