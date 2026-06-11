export const EXPENSE_CATEGORIES = ['Transport', 'Accommodation', 'Food', 'Tickets', 'Shopping', 'Other'];

export class Expense {
  constructor(data = {}) {
    this.id = data.id || '';
    this.travelPlanId = data.travelPlanId || '';
    this.name = data.name || '';
    this.category = data.category || 'Other';
    this.amount = data.amount || 0;
    this.date = data.date || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || null;
  }
}
