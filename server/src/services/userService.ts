import type { IUser } from "../interfaces/interfaces.js";

class UserService
{
  private users: IUser[] = [];

  async add( username: string, socketId: string )
  {
    const user: IUser = { username, socketId };
    this.users.push( user );
    return user;
  }

  delete( username: string )
  {
    const index = this.users.findIndex( ( u ) => u.username === username );
    if ( index === -1 ) return false;
    this.users.splice( index, 1 );
    return true;
  }

  deleteBySocket( socket: string )
  {
    const index = this.users.findIndex( ( u ) => u.socketId === socket );
    if ( index === -1 ) return false;
    this.users.splice( index, 1 );
    return true;
  }

  getBySocket( socketId: string )
  {
    return this.users.find( ( u ) => u.socketId === socketId );
  }

  getByName( name: string )
  {
    return this.users.find( ( u ) => u.username === name );
  }

  getAll()
  {
    return this.users;
  }
}

export default new UserService();