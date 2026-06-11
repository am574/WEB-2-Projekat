export class ShareToken {
  constructor(data = {}) {
    this.id = data.id || '';
    this.travelPlanId = data.travelPlanId || '';
    this.token = data.token || '';
    this.accessType = data.accessType || 'VIEW';
    this.qrCodeBase64 = data.qrCodeBase64 || '';
    this.createdAt = data.createdAt || null;
    this.expiresAt = data.expiresAt || null;
  }
}
