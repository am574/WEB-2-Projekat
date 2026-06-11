export class TravelPlan {
  constructor(data = {}) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.startDate = data.startDate || '';
    this.endDate = data.endDate || '';
    this.budget = data.budget || 0;
    this.notes = data.notes || '';
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
    this.destinations = data.destinations || [];
    this.activities = data.activities || [];
    this.checklistItems = data.checklistItems || [];
  }
}
