import type { IUser } from "../interfaces/interfaces.js";

class UserService {
  private users: IUser[] = [];

  async add(username: string, socketId: string): Promise<IUser> {
    const user: IUser = { username, socketId };
    this.users.push(user);
    return user;
  }

  async delete(username: string): Promise<boolean> {
    const index = this.users.findIndex((u) => u.username === username);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  async getBySocket(socketId: string): Promise<IUser | undefined> {
    return this.users.find((u) => u.socketId === socketId);
  }

  async getByName(name: string): Promise<IUser | undefined> {
    return this.users.find((u) => u.username === name);
  }
}

export default new UserService();
