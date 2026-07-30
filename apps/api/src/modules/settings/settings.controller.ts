import type { Request, Response, NextFunction } from 'express';

// In-memory / persistent store settings with initial defaults
let storeSettings = {
  store_name: 'StoreCo Commerce',
  support_email: 'support@storeco.com',
  currency_symbol: '$',
  currency_code: 'USD',
  tax_rate: 8.5,
  timezone: 'America/New_York',
  maintenance_mode: false,
  allow_registration: true,
  allow_guest_checkout: true,
  stripe_enabled: true,
  paypal_enabled: false,
  cod_enabled: true,
};

export class SettingsController {
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, message: 'Settings retrieved', data: storeSettings });
    } catch (err) { next(err); }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      storeSettings = { ...storeSettings, ...req.body };
      res.json({ success: true, message: 'Settings updated successfully', data: storeSettings });
    } catch (err) { next(err); }
  }
}
