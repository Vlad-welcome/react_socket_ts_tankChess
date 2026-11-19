import { socket } from "../../api/socket";
import { Events } from "../../socketEvents.js";
import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { useMemo } from "react";
import { ConfirmFunc } from "../../components/index.js";

export function useGame(username) {
  const [connected, setConnected] = useState(false);
  const [enemySocketId, setEnemySocketId] = useState(-1);
  const [start, setStart] = useState(false);
  const [isRoom, setIsRoom] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      console.log("connect");
    });
    socket.on("disconnect", () => {
      setConnected(false);
      console.log("disconnect");
    });

    socket.on(Events.INVITED, async (response) => {
      console.log("invited");
      const ok = await ConfirmFunc(`Вас приглашает в игру. Принять?`);
      if (ok) {
        document.title = "Ожидайте";
        setPlayer(2);
        setEnemySocketId(response.playerSocketId);

        socket.emit(Events.GAME_START, response.playerSocketId);
        setStart(true);
        setIsRoom(true);
        setBoard(response.board);
        setPrevBoard(response.board);
        setTypeTanks(response.typeTanks);
        setSIZE(response.SIZE);
      }
    });

    socket.on(Events.GAME_STARTED, (response) => {
      document.title = "Ходите";

      console.log("started");
      setTurn(true);
      setEnemySocketId(response.playerSocketId);
      setStart(response.start);
      setBoard(response.board);
      setPrevBoard(response.board);
      setTypeTanks(response.typeTanks);
      setSIZE(response.SIZE);
    });

    socket.on(Events.NEXT_TURNED, (response) => {
      console.log("turned");
      setTurn(true);
      setBoard(response.board);
      setPrevBoard(response.board);
      document.title = "Ходите";
    });

    socket.on(Events.EXITED, async (response) => {
      if (response.text) {
        await ConfirmFunc(response.text, "Ок", false);
      }
      endGame();
    });

    socket.on(Events.SHOTED, async (response) => {
      console.log("shoted");

      setTurn(!response.win);
      setBoard(response.board);
      setPrevBoard(response.board);
      document.title = "Ходите";

      if (response.win) {
        console.log("defeated");
        await ConfirmFunc("Поражение", "Ок", false);
        endGame();
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off(Events.INVITED);
      socket.off(Events.GAME_STARTED);
      socket.off(Events.NEXT_TURNED);
      socket.off(Events.EXITED);
      socket.off(Events.SHOTED);
    };
  }, []);

  const join = (onResult) => {
    console.log("join", username);
    socket.connect();
    socket.emit(Events.JOIN, username, async (response) => {
      if (response.success) {
        onResult(true);
      } else {
        socket.disconnect();
        onResult(false);
        await ConfirmFunc("Пользователь с таким именем уже существует", "Ок", false);
      }
    });
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

    socket.emit(Events.EXIT, enemySocketId);
  };

  const nextTurn = () => {
    console.log("nextTurn");
    document.title = "Ожидайте";
    setTurn(false);
    socket.emit(Events.NEXT_TURN, enemySocketId, board, (response) => {
      if (!response.success) {
        setBoard(prevBoard);
        setTurn(true);
        document.title = "Ходите";
      }
    });
  };

  const endGame = () => {
    document.title = "front";

    console.log("endGame");
    setStart(false);
    setIsRoom(false);
    setEnemySocketId(-1);

    setSelected(false);
  };

  const shot = (shoted) => {
    console.log("shot");
    setTurn(false);
    document.title = "Ожидайте";
    socket.emit(Events.SHOT, enemySocketId, board, selected, shoted, async (response) => {
      if (response.success) {
        setBoard(response.board);
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
  const [SIZE, setSIZE] = useState(-1);
  const STEP = 45;

  const [player, setPlayer] = useState(-1);
  const [turn, setTurn] = useState(false);

  const [selected, setSelected] = useState(null);
  const [prevSelected, setPrevSelected] = useState(null);

  const [board, setBoard] = useState(null);
  const [prevBoard, setPrevBoard] = useState(null);
  const [typeTanks, setTypeTanks] = useState(null);

  const [move, setMove] = useState("-");
  const [armor, setArmor] = useState("-");
  const [damage, setDamage] = useState("-");

  // поворот на ±STEP градусов
  const rotateSelected = useCallback(
    async (delta) => {
      if (!selected || move <= 0) return;

      setMove((m) => m - 1);

      setBoard((prev) => {
        const { row, col } = selected;
        const t = prev[row][col];
        if (!t) return prev;

        const next = prev.map((r) => r.slice());
        next[row][col] = {
          ...t,
          rotate: (((t.rotate + delta) % 360) + 360) % 360,
        };
        return next;
      });

      setSelected((prev) => ({
        ...prev,
        rotate: (((prev.rotate + delta) % 360) + 360) % 360,
      }));
    },
    [selected, move],
  );

  const DIRS = {
    0: [-1, 0],
    45: [-1, 1],
    90: [0, 1],
    135: [1, 1],
    180: [1, 0],
    225: [1, -1],
    270: [0, -1],
    315: [-1, -1],
  };

  // передний ход
  const moveSelected = useCallback(async () => {
    if (!selected || move <= 0) return;

    const { row, col } = selected;
    const tank = board[row][col];
    if (!tank) return;

    let newRow = row + DIRS[tank.rotate][0];
    let newCol = col + DIRS[tank.rotate][1];

    if (newCol < 0 || newCol >= SIZE) return;

    if ((tank.type === "wLTK" || tank.type === "wMTK" || tank.type === "wHTK") && newRow < 0) {
      console.log("white win");
      await ConfirmFunc("Победа", "Ок", false);
      socket.emit(Events.EXIT, enemySocketId, "Поражение");
      endGame();
    } else if (
      (tank.type === "bLTK" || tank.type === "bMTK" || tank.type === "bHTK") &&
      newRow === SIZE
    ) {
      console.log("black win");
      await ConfirmFunc("Победа", "Ок", false);
      socket.emit(Events.EXIT, enemySocketId, "Поражение");
      endGame();
    }

    if (newRow < 0 || newRow >= SIZE) return;
    if (board[newRow][newCol]) return;

    setBoard((prev) => {
      const next = prev.map((r) => r.slice());
      next[row][col] = null;
      next[newRow][newCol] = tank;
      return next;
    });
    setSelected({ row: newRow, col: newCol, rotate: tank.rotate });
    setMove((m) => m - 1);
  }, [selected, board, move]);

  // задний ход
  const moveBackSelected = useCallback(async () => {
    if (!selected || move <= 0) return;

    const { row, col } = selected;
    const tank = board[row][col];
    if (!tank) return;

    if (move !== typeTanks[tank.type].moves) return;

    const newRotate = (((tank.rotate + 180) % 360) + 360) % 360;

    let newRow = row + DIRS[newRotate][0];
    let newCol = col + DIRS[newRotate][1];

    if (newCol < 0 || newCol >= SIZE) return;

    if ((tank.type === "wLTK" || tank.type === "wMTK" || tank.type === "wHTK") && newRow < 0) {
      console.log("white win");
      await ConfirmFunc("Победа", "Ок", false);
      socket.emit(Events.EXIT, enemySocketId, "Поражение");
      endGame();
    } else if (
      (tank.type === "bLTK" || tank.type === "bMTK" || tank.type === "bHTK") &&
      newRow === SIZE
    ) {
      console.log("black win");
      await ConfirmFunc("Победа", "Ок", false);
      socket.emit(Events.EXIT, enemySocketId, "Поражение");
      endGame();
    }

    if (newRow < 0 || newRow >= SIZE) return;
    if (board[newRow][newCol]) return;

    setBoard((prev) => {
      const next = prev.map((r) => r.slice());
      next[row][col] = null;
      next[newRow][newCol] = tank;
      return next;
    });
    setSelected({ row: newRow, col: newCol, rotate: tank.rotate });
    setMove((m) => 0);
  }, [selected, board, move]);

  function checkEndMove() {
    if (selected === null || prevSelected === null) return false;
    return (
      selected.row !== prevSelected.row ||
      selected.col !== prevSelected.col ||
      selected.rotate !== prevSelected.rotate
    );
  }

  // A / D / W / S
  useEffect(() => {
    if (!selected) return;

    const onKeyDown = (e) => {
      if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") {
        e.preventDefault();
        rotateSelected(-STEP);
      } else if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") {
        e.preventDefault();
        rotateSelected(+STEP);
      } else if (e.key === "w" || e.key === "W" || e.key === "ArrowUp") {
        e.preventDefault();
        moveSelected();
      } else if (e.key === "s" || e.key === "S" || e.key === "ArrowDown") {
        e.preventDefault();
        moveBackSelected();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (checkEndMove()) {
          setSelected(null);
          setPrevSelected(null);
          setMove("-");
          setArmor("-");
          setDamage("-");
          nextTurn();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, rotateSelected, moveSelected, moveBackSelected]);

  // клик по танку — выбрать; клик по пустой клетке — снять выбор
  const handleCellClick = (row, col) => {
    const t = board[row][col];
    if (t && turn && t.player === player) {
      setSelected({ row, col, rotate: t.rotate });
      setPrevSelected({ row, col, rotate: t.rotate });
      setBoard(prevBoard);
      setMove(typeTanks[t.type].moves);
      setArmor(typeTanks[t.type].armor);
      setDamage(typeTanks[t.type].damage);
    } else if (prevSelected !== null) {
      setSelected(null);
      setPrevSelected(null);
      setBoard(prevBoard);
      setMove("-");
      setArmor("-");
      setDamage("-");
    }
  };

  const handleCellRightClick = (row, col) => {
    if (selected && turn) {
      if (checkEndMove() && highlighted.has(`${row},${col}`)) {
        setSelected(null);
        setPrevSelected(null);
        shot({ row, col });
      }
    }
  };

  function castRay(set, board, startRow, startCol, typeShot, [dr, dc], startDist, endDist) {
    if (typeShot === "tank") {
      const rs = startRow + dr;
      const cs = startCol + dc;
      if (rs < 0 || rs >= SIZE || cs < 0 || cs >= SIZE) return;
      if (board?.[rs]?.[cs]) return;

      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
        set.add(`${r},${c}`);
        if (board?.[r]?.[c]) break;
      }
    }

    if (typeShot === "arta") {
      for (let d = startDist; d <= endDist; d++) {
        const r = startRow + dr * d;
        const c = startCol + dc * d;
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
        set.add(`${r},${c}`);
      }
    }
  }

  const highlighted = useMemo(() => {
    const set = new Set();
    if (!selected) return set;

    const { row, col } = selected;
    const tank = board?.[row]?.[col];
    if (!tank) return set;

    const typeTank = typeTanks[tank.type];

    const front = DIRS[tank.rotate];
    let left = null;
    let right = null;
    if (typeTank.shot.sides > 1) {
      left = DIRS[(tank.rotate - 45 + 360) % 360];
      right = DIRS[(tank.rotate + 45) % 360];
    }

    for (const dir of [front, left, right]) {
      if (dir) {
        castRay(
          set,
          board,
          row,
          col,
          typeTank.shot.type,
          dir,
          typeTank.shot.min,
          typeTank.shot.max,
        );
      }
    }
    return set;
  }, [selected, board]);

  const cells = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const isLight = (row + col) % 2 === 0;
      const tank = board?.[row]?.[col] ?? null;
      const isSelected = selected && selected.row === row && selected.col === col;
      const isHighlighted = highlighted.has(`${row},${col}`);
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
    nextTurn,
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
