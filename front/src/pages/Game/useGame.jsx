import { Events } from "../../socketEvents.js";
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useMemo } from "react";
import { ConfirmFunc } from "../../components/index.js";
import { io } from "socket.io-client";

export function useGame(username) {
  const [connected, setConnected] = useState(false);
  const [enemyPlayer, setEnemyPlayer] = useState(-1);
  const [start, setStart] = useState(false);
  const [isRoom, setIsRoom] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setConnected(true);
      console.log("connect");
    };
    const onDisconnect = () => {
      setConnected(false);
      console.log("disconnect");
    };
    const onInvited = async (response) => {
      console.log("invited");
      const ok = await ConfirmFunc(`Вас приглашает в игру. Принять?`);
      if (ok) {
        document.title = "Ожидайте";
        setPlayer(2);
        setEnemyPlayer(response.enemyPlayer);

        socket.emit(Events.GAME_START, response.enemyPlayer);
        setIsRoom(true);
        setStart(true);
        setSIZE(response.size);
        setTypeTanks(response.typeTanks);
        setBoard(response.board);
      }
    };
    const onGameStarted = (response) => {
      document.title = "Ходите";

      console.log("started");
      setTurn(true);
      setStart(true);
      setEnemyPlayer(response.enemyPlayer);
      setSIZE(response.size);
      setTypeTanks(response.typeTanks);
      setBoard(response.board);
    };
    const onNextTurned = (response) => {
      console.log("turned");
      setTurn(true);
      setBoard(response.board);
      document.title = "Ходите";
    };
    const onExited = async (response) => {
      if (response.text) {
        await ConfirmFunc(response.text, "Ок", false);
      }
      endGame();
    };
    const onShoted = async (response) => {
      console.log("shoted");

      setTurn(!response.win);
      setBoard(response.board);
      document.title = "Ходите";

      if (response.win) {
        console.log("defeated");
        await ConfirmFunc("Поражение", "Ок", false);
        endGame();
      }
    };
    const onEnemyMoved = (response) => {
      console.log("ENEMY_MOVED");
      if (response.board?.length > 0) {
        setBoard(response.board);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(Events.INVITED, onInvited);
    socket.on(Events.GAME_STARTED, onGameStarted);
    socket.on(Events.NEXT_TURNED, onNextTurned);
    socket.on(Events.EXITED, onExited);
    socket.on(Events.SHOTED, onShoted);
    socket.on(Events.ENEMY_MOVED, onEnemyMoved);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(Events.INVITED, onInvited);
      socket.off(Events.GAME_STARTED, onGameStarted);
      socket.off(Events.NEXT_TURNED, onNextTurned);
      socket.off(Events.EXITED, onExited);
      socket.off(Events.SHOTED, onShoted);
      socket.off(Events.ENEMY_MOVED, onEnemyMoved);
    };
  }, [socket]);

  const join = (onResult) => {
    socket?.disconnect();
    console.log("join", username);

    const s = io(import.meta.env.VITE_FRONT_API, {
      autoConnect: false,
      withCredentials: true,
      auth: { username: username },
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    setSocket(s);

    s.on("connect", () => {
      s.emit(Events.JOIN, username, async (response) => {
        if (response.success) {
          onResult(true);
        } else {
          s.disconnect();
          onResult(false);
          await ConfirmFunc("Пользователь с таким именем уже существует", "Ок", false);
        }
      });
    });
    s.connect();
  };

  const room = () => {
    console.log("room");
    socket.emit(Events.ROOM, (response) => {
      if (response.success) {
        setIsRoom(true);
        setPlayer(1);
      }
    });
  };

  const invite = (invitePlayer) => {
    console.log("invite");
    const name = invitePlayer?.trim();
    if (!name) {
      return;
    }
    socket.emit(Events.INVITE, name, async (response) => {
      if (!response.success) {
        await ConfirmFunc("Пользователь не в сети", "Ок", false);
      }
    });
  };

  const exit = () => {
    endGame();

    socket.emit(Events.EXIT, enemyPlayer);
  };

  const nextTurn = () => {
    console.log("nextTurn");

    socket.emit(Events.NEXT_TURN, enemyPlayer, (response) => {
      if (!response.success) {
        setTurn(true);
        document.title = "Ходите";
      } else {
        document.title = "Ожидайте";
        setTurn(false);
        setSelected(null);
        setHighlighted(null);
        setMove("-");
        setArmor("-");
        setDamage("-");
      }
    });
  };

  const endGame = () => {
    document.title = "front";

    console.log("endGame");
    setStart(false);
    setIsRoom(false);
    setEnemyPlayer(-1);

    setSelected(false);
  };

  const shot = (shoted) => {
    console.log("shot");
    socket.emit(Events.SHOT, enemyPlayer, shoted, async (response) => {
      if (response.success) {
        setTurn(false);
        document.title = "Ожидайте";

        setBoard(response.board);
        setSelected(null);
        setHighlighted(null);
        setMove("-");
        setArmor("-");
        setDamage("-");

        if (response.win) {
          console.log("Win");
          await ConfirmFunc("Победа", "Ок", false);
          endGame();
        }
      }
    });
  };

  //GAME
  const [player, setPlayer] = useState(-1);
  const [turn, setTurn] = useState(false);

  const [selected, setSelected] = useState(null);
  const [board, setBoard] = useState(null);
  const [highlighted, setHighlighted] = useState(() => new Set());

  const [SIZE, setSIZE] = useState(-1);
  const [typeTanks, setTypeTanks] = useState(null);

  const [move, setMove] = useState("-");
  const [armor, setArmor] = useState("-");
  const [damage, setDamage] = useState("-");

  //Поворот на 45
  const rotateSelected = useCallback(
    async (delta) => {
      if (!selected || move <= 0) return;

      console.log("rotateSelected");

      socket.emit(Events.TANK_ROTATE, enemyPlayer, delta, (response) => {
        if (response.success) {
          setBoard(response.board);
          setSelected(response.selected);
          setHighlighted(new Set(response.highlighted));
          setMove(response.move);
        }
      });
    },
    [selected, board, move],
  );

  // передний ход
  const moveSelected = useCallback(async () => {
    if (!selected || move <= 0) return;

    console.log("moveSelected");

    socket.emit(Events.MOVE_FORWARD, enemyPlayer, async (response) => {
      if (response.success) {
        setBoard(response.board);
        setSelected(response.selected);
        setHighlighted(new Set(response.highlighted));
        setMove(response.move);

        if (response.win) {
          console.log("Win");
          socket.emit(Events.EXIT, enemyPlayer, "Поражение");
          await ConfirmFunc("Победа", "Ок", false);
          endGame();
        }
      }
    });
  }, [selected, board, move]);

  // задний ход
  const moveBackSelected = useCallback(async () => {
    if (!selected || move <= 0) return;

    console.log("moveBackSelected");

    socket.emit(Events.MOVE_BACK, enemyPlayer, async (response) => {
      if (response.success) {
        setBoard(response.board);
        setSelected(response.selected);
        setHighlighted(new Set(response.highlighted));
        setMove(response.move);

        if (response.win) {
          console.log("Win");
          socket.emit(Events.EXIT, enemyPlayer, "Поражение");
          await ConfirmFunc("Победа", "Ок", false);
          endGame();
        }
      }
    });
  }, [selected, board, move]);

  // A / D / W / S
  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (e) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        e.preventDefault();
        rotateSelected(-1);
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        e.preventDefault();
        rotateSelected(+1);
      } else if (e.code === "KeyW" || e.code === "ArrowUp") {
        e.preventDefault();
        moveSelected();
      } else if (e.code === "KeyS" || e.code === "ArrowDown") {
        e.preventDefault();
        moveBackSelected();
      } else if (e.key === "Enter") {
        e.preventDefault();
        nextTurn();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, rotateSelected, moveSelected, moveBackSelected]);

  // клик по танку — выбрать; клик по пустой клетке — снять выбор
  const handleCellClick = (row, col) => {
    if (turn) {
      console.log("LEFT_CLICK");
      socket.emit(Events.LEFT_CLICK, { row, col }, player, enemyPlayer, (response) => {
        if (response.success) {
          if (response.board?.length > 0) {
            setBoard(response.board);
          }
          setSelected(response.selected);
          if (!response.selected) {
            setMove("-");
            setArmor("-");
            setDamage("-");
          } else {
            const t = board[row][col];

            setMove(typeTanks[t.type].moves);
            setArmor(typeTanks[t.type].armor);
            setDamage(typeTanks[t.type].damage);
          }
          setHighlighted(new Set(response.highlighted));
        }
      });
    }
  };

  const handleCellRightClick = (row, col) => {
    if (selected && turn) {
      if (highlighted.has(`${row},${col}`)) {
        shot({ row, col });
      }
    }
  };

  const cells = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const isLight = (row + col) % 2 === 0;
      const tank = board?.[row]?.[col] ?? null;
      const isSelected = selected && selected.row === row && selected.col === col;
      const isHighlighted = highlighted?.has(`${row},${col}`);
      const isAlly = tank?.player === player;

      cells.push(
        <div
          key={`${row}-${col}`}
          className={[
            "cell",
            isLight ? "light" : "dark",
            isSelected && "selected",
            isHighlighted && "highlight",
            isAlly && !isSelected && turn && "ally",
          ]
            .filter(Boolean)
            .join(" ")}
          data-row={row}
          data-col={col}
          onClick={() => handleCellClick(row, col)}
          onContextMenu={(e) => {
            e.preventDefault();
            handleCellRightClick(row, col);
          }}
        >
          {tank && (
            <img
              src={typeTanks[tank.type].img}
              alt=""
              className="overlay-img"
              draggable={false}
              style={{
                transform: `rotate(${tank?.rotate || 0}deg)`,
                "--img-size": SIZE === 16 ? "56px" : "72px",
              }}
            />
          )}
        </div>,
      );
    }
  }

  return {
    connected,
    join,
    room,
    invite,
    exit,
    start,
    isRoom,
    cells,
    turn,
    move,
    armor,
    damage,
    SIZE,
  };
}
