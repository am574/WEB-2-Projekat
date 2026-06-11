export class Destination {
  constructor(data = {}) {
    this.id = data.id || '';
    this.travelPlanId = data.travelPlanId || '';
    this.name = data.name || '';
    this.location = data.location || '';
    this.arrivalDate = data.arrivalDate || '';
    this.departureDate = data.departureDate || '';
    this.description = data.description || '';
    this.createdAt = data.createdAt || null;
  }
}
