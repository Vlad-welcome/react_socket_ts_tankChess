export const Events = {
  // server → client
  INVITED: "game:invited",
  GAME_STARTED: "game:started",
  NEXT_TURNED: "game:next_turned",
  EXITED: "game:exited",
  SHOTED: "tank:shoted",
  ENEMY_MOVED: "enemy:moved",

  // client → server
  JOIN: "user:join",
  ROOM: "game:room",
  INVITE: "game:invite",
  GAME_START: "game:start",
  NEXT_TURN: "game:next_turn",
  EXIT: "game:exit",
  SHOT: "tank:shot",
  LEFT_CLICK: "tank:left_click",
  MOVE_FORWARD: "tank:move_forward",
  MOVE_BACK: "tank:move_back",
  TANK_ROTATE: "tank:rotate",
  CONTINUE_GAME: "game:continue",
} as const;

// Тип конкретного значения: "game:invited" | "game:started" | ...
export type EventName = (typeof Events)[keyof typeof Events];

// Тип ключа: "INVITED" | "GAME_STARTED" | ...
export type EventKey = keyof typeof Events;
