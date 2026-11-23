import type { Server, Socket } from "socket.io";
import userService from "../services/userService.js";
import { Events } from "../socketEvents.js";

export const userController = ( io: Server, socket: Socket ): void =>
{
  console.log( "Server connection" );

  const { username } = socket.handshake.auth;
  const name = typeof username === "string" ? username.trim() : "";

  if ( name )
  {
    const user = userService.getByName( name );
    if ( user )
    {
      user.socketId = socket.id;
    }
    else
    {
      userService.add( name, socket.id );
    }
  }
  console.log( userService.getAll() );

  socket.on( "disconnect", () =>
  {
    console.log( "Server disconnect" );
    userService.deleteBySocket( socket.id );
    console.log( userService.getAll() );
  } );

  socket.on(
    Events.JOIN,
    ( username: unknown, callback: ( res: { success: boolean } ) => void ) =>
    {
      console.log( "Server Events.JOIN" );
      if ( typeof username !== "string" )
      {
        callback( { success: false } );
        return;
      }

      const name = username.trim();
      if ( !name )
      {
        callback( { success: false } );
        return;
      }

      const existing = userService.getByName( name );
      if ( existing )
      {
        existing.socketId = socket.id;
      }
      else
      {
        userService.add( name, socket.id );
      }
      callback( { success: true } );
    },
  );
};
