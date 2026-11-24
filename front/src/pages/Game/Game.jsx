import { useState, useEffect, useRef } from "react";

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

  const onInvite = () => {
    game.invite(invitePlayer);
  };

  const onExit = () => {
    game.exit();
  };

  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [game.history]);

  //game
  if (!joined) {
    return (
      <div className="d-flex justify-content-center mt-3 mx-3 mt-md-5 mx-md-5">
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
  } else if (game.start) {
    const letters = Array.from(
      { length: game.SIZE },
      (_, i) => String.fromCharCode(97 + i), // 97 = 'a'
    );

    // цифры: 0..SIZE-1 сверху вниз (совпадает с data-row)
    const numbers = Array.from({ length: game.SIZE }, (_, i) => i + 1);
    return (
      <div className="d-flex min-vh-100 justify-content-center align-items-center">
        <div>
          <div className="d-flex flex-column flex-md-row align-items-center">
            <div className="me-0 mb-3 d-flex mb-md-0 me-md-3 flex-md-column justify-content-center align-items-center">
              <div>
                <div>
                  <h5>Параметры</h5>
                </div>
                <div>
                  <span>
                    <b>- Move: {game.move}</b>
                  </span>
                </div>
                <div>
                  <span>- Armor:</span>
                  <div>
                    <span>--- front {game.armor.front}</span>
                  </div>
                  <div>
                    <span>--- side {game.armor.side}</span>
                  </div>
                  <div>
                    <span>--- back {game.armor.back}</span>
                  </div>
                </div>
                <div>
                  <span>
                    <b>- Damage: {game.damage}</b>
                  </span>
                </div>
              </div>

              <div className="d-flex mt-2 mt-md-4">
                <div>
                  <div className="d-flex justify-content-center gap-1 mb-1">
                    <Button
                      variant="outline-primary"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={game.moveSelected}
                    >
                      W
                    </Button>
                    <Button
                      variant="outline-primary"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={game.nextTurn}
                    >
                      Enter
                    </Button>
                  </div>
                  <div className="d-flex gap-1">
                    <Button
                      variant="outline-primary"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={game.rotateSelectedLeft}
                    >
                      A
                    </Button>
                    <Button
                      variant="outline-primary"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={game.moveBackSelected}
                    >
                      S
                    </Button>
                    <Button
                      variant="outline-primary"
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={game.rotateSelectedRight}
                    >
                      D
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="d-md-flex justify-content-between align-items-center mb-2 mx-4">
                <div className="d-flex justify-content-center align-items-center mb-2 mb-md-0">
                  <h3 className="mb-0">{game.selectedMap}</h3>
                </div>
                <div className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0">{!game.turn ? "Ожидайте" : "Ходите"}</h3>
                  <div className="d-flex justify-content-center ms-3">
                    <Button variant="danger" onClick={onExit}>
                      Выйти
                    </Button>
                  </div>
                </div>
              </div>
              <div className="board-wrapper" style={{ "--grid-size": game.SIZE }}>
                {/* верхний ряд */}
                <div />
                <div className="labels labels-col">
                  {letters.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                <div />

                {/* средний ряд */}
                <div className="labels labels-row">
                  {numbers.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>

                <div className="chess-board">{game.cells}</div>

                <div className="labels labels-row">
                  {numbers.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>

                {/* нижний ряд */}
                <div />
                <div className="labels labels-col">
                  {letters.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </div>
                <div />
              </div>
            </div>

            <div ref={listRef} className="ms-0 mt-2 ms-md-3 history-list">
              {game.history?.map((item, index) => (
                <div key={index} className="history-item">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="d-flex justify-content-center mt-3 mx-3">
        <div className="col-11 col-md-8">
          <div>
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
            </InputGroup>
          </div>

          <div className="mt-2">
            <select
              className="form-select"
              value={game.selectedMap ?? ""}
              onChange={(e) => game.setSelectedMap(e.target.value)}
            >
              <option value="" disabled>
                Выберите...
              </option>
              {game.maps.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }
};
