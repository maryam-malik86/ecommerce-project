import { AnalyticsRepository } from './analytics.repository.js';
import { createApiError } from '../../middlewares/errorHandler.middleware.js';

export class AnalyticsService {
  private repo = new AnalyticsRepository();

  private validateDateRange(from?: string, to?: string): { from: string; to: string } {
    const now = new Date();
    const resolved = {
      from: from ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!, // first of this month
      to: to ?? now.toISOString().split('T')[0]!, // today
    };

    if (new Date(resolved.from) > new Date(resolved.to)) {
      throw createApiError(400, 'Date "from" must be before "to"');
    }

    return resolved;
  }

  async getProfitSummary(from?: string, to?: string) {
    const range = this.validateDateRange(from, to);
    return this.repo.getProfitSummary(range.from, range.to);
  }

  async getProfitByProduct(from?: string, to?: string) {
    const range = this.validateDateRange(from, to);
    return this.repo.getProfitByProduct(range.from, range.to);
  }

  async getTimeSeries(from?: string, to?: string, groupBy: 'day' | 'month' = 'day') {
    const range = this.validateDateRange(from, to);
    return this.repo.getRevenueTimeSeries(range.from, range.to, groupBy);
  }
}
