export class ChecklistItem {
  constructor(data = {}) {
    this.id = data.id || '';
    this.travelPlanId = data.travelPlanId || '';
    this.name = data.name || '';
    this.isCompleted = data.isCompleted || false;
    this.orderIndex = data.orderIndex || 0;
    this.createdAt = data.createdAt || null;
  }
}
