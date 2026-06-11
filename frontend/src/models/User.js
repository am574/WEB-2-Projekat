export class User {
  constructor(data = {}) {
    this.id = data.id || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.email = data.email || '';
    this.role = data.role || 'User';
    this.createdAt = data.createdAt || null;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  get isAdmin() {
    return this.role === 'Admin';
  }
}
