import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  // GET /analytics/profit?from=2024-01-01&to=2024-12-31
  async getProfitSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await analyticsService.getProfitSummary(from, to);
      res.json({ success: true, message: 'Profit summary retrieved', data });
    } catch (err) { next(err); }
  }

  // GET /analytics/profit/by-product
  async getProfitByProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await analyticsService.getProfitByProduct(from, to);
      res.json({ success: true, message: 'Product profit breakdown retrieved', data });
    } catch (err) { next(err); }
  }

  // GET /analytics/revenue/timeseries?groupBy=day|month
  async getTimeSeries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to, groupBy } = req.query as {
        from?: string;
        to?: string;
        groupBy?: 'day' | 'month';
      };
      const data = await analyticsService.getTimeSeries(from, to, groupBy ?? 'day');
      res.json({ success: true, message: 'Revenue time series retrieved', data });
    } catch (err) { next(err); }
  }
}
