import { useState, useEffect, useCallback } from "react";

import "./Game.css";
import { useGame } from "./useGame.jsx";

import { Button, Form, InputGroup } from "react-bootstrap";

export const Game = () => {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [invitePlayer, setInvitePlayer] = useState("");

  const game = useGame(username);

  const onJoin = () => {
    if (!username.trim()) return;
    game.join((res) => setJoined(res));
  };

  const onBoard = () => {
    game.room();
  };

  const onInvite = () => {
    game.invite(invitePlayer);
  };

  const onExit = () => {
    game.exit();
  };

  //game
  if (!joined) {
    return (
      <div className="d-flex justify-content-center mt-3 mx-3">
        <InputGroup>
          <Form.Control
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onJoin()}
            placeholder="Ваше имя"
          />
          <Button variant="outline-primary" onClick={onJoin}>
            Войти
          </Button>
        </InputGroup>
      </div>
    );
  } else if (!game.isRoom) {
    return (
      <div className="d-flex justify-content-center mt-3">
        <Button variant="primary" onClick={onBoard}>
          Создать комнату
        </Button>
      </div>
    );
  } else if (game.start) {
    return (
      <div className="d-flex min-vh-100 justify-content-center align-items-center">
        <div>
          <div className="d-flex justify-content-center align-items-center">
            <h3>{!game.turn ? "Ожидайте" : "Ходите"}</h3>
            <div className="d-flex justify-content-center ms-3">
              <Button variant="danger" onClick={onExit}>
                Выйти
              </Button>
            </div>
          </div>
          <div className="mb-2">
            Параметры: <b>move: {game.move}</b> armor: front {game.armor.front}, side{" "}
            {game.armor.side}, back {game.armor.back} damage: {game.damage}
          </div>
          <div className="chess-board">{game.cells}</div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="d-flex justify-content-center mt-3 mx-3">
        <InputGroup>
          <Form.Control
            type="text"
            value={invitePlayer}
            onChange={(e) => setInvitePlayer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onInvite()}
            placeholder="Имя игрока"
          />
          <Button variant="outline-primary" onClick={onInvite}>
            Пригласить
          </Button>
          <Button variant="outline-danger" onClick={onExit}>
            Выйти
          </Button>
        </InputGroup>
      </div>
    );
  }
};
