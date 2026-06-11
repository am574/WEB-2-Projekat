export const ACTIVITY_STATUSES = ['Planned', 'Reserved', 'Completed', 'Cancelled'];

export class Activity {
  constructor(data = {}) {
    this.id = data.id || '';
    this.travelPlanId = data.travelPlanId || '';
    this.destinationId = data.destinationId || null;
    this.name = data.name || '';
    this.date = data.date || '';
    this.time = data.time || null;
    this.location = data.location || '';
    this.description = data.description || '';
    this.estimatedCost = data.estimatedCost || null;
    this.status = data.status || 'Planned';
    this.createdAt = data.createdAt || null;
  }
}
