import type { IUser } from "../interfaces/interfaces.js";

class UserService {
  private byName = new Map<string, IUser>(); // username  → user
  private bySocket = new Map<string, string>(); // socketId  → username

  add(username: string, socketId: string): IUser {
    const existing = this.byName.get(username);
    if (existing && existing.socketId !== socketId) {
      this.bySocket.delete(existing.socketId);
    }

    const user: IUser = { username, socketId };
    this.byName.set(username, user);
    this.bySocket.set(socketId, username);
    return user;
  }

  deleteByName(username: string): boolean {
    const user = this.byName.get(username);
    if (!user) return false;

    this.byName.delete(username);
    this.bySocket.delete(user.socketId);
    return true;
  }

  deleteBySocket(socketId: string): boolean {
    const username = this.bySocket.get(socketId);
    if (!username) return false;

    const user = this.byName.get(username);

    if (!user || user.socketId !== socketId) {
      this.bySocket.delete(socketId);
      return false;
    }

    this.byName.delete(username);
    this.bySocket.delete(socketId);
    return true;
  }

  getBySocket(socketId: string): IUser | undefined {
    const username = this.bySocket.get(socketId);
    return username ? this.byName.get(username) : undefined;
  }

  getByName(name: string): IUser | undefined {
    return this.byName.get(name);
  }

  getAll(): IUser[] {
    return [...this.byName.values()];
  }
}

export default new UserService();
