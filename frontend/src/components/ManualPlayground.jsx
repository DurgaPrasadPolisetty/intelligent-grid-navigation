
import { useCallback, useEffect, useRef, useState } from "react";
import { playSound } from "../utils/soundEffects";

function ManualPlayground({
  environment,
  position,
  setPosition,
  soundEnabled = true,
  soundVolume = 0.35,
}) {
  const [totalReward, setTotalReward] = useState(0);
  const [moves, setMoves] = useState(0);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [finished, setFinished] = useState(false);

  const soundSettings = {
    enabled: soundEnabled,
    volume: soundVolume,
  };

  // Keep the keyboard handler synchronized with the latest state.
  const stateRef = useRef(null);

  stateRef.current = {
    environment,
    position,
    totalReward,
    moves,
    finished,
  };

  const resetEpisode = useCallback(() => {
    setPosition([...environment.start]);
    setTotalReward(0);
    setMoves(0);
    setRewardHistory([]);
    setFinished(false);
  }, [environment, setPosition]);

  // Reset the manual episode when the environment changes.
  useEffect(() => {
    resetEpisode();
  }, [resetEpisode]);

  const moveAgent = useCallback(
    (dr, dc) => {
      const current = stateRef.current;

      if (!current || current.finished) return;

      const {
        environment: env,
        position: currentPosition,
        totalReward: currentTotal,
        moves: currentMoves,
      } = current;

      const [row, col] = currentPosition;
      const next = [row + dr, col + dc];

      const sameCell = (a, b) =>
        a[0] === b[0] && a[1] === b[1];

      const contains = (cells, cell) =>
        (cells ?? []).some((item) => sameCell(item, cell));

      const action =
        dr === -1
          ? "UP"
          : dr === 1
            ? "DOWN"
            : dc === -1
              ? "LEFT"
              : "RIGHT";

      // Boundary collision: record the attempt and play warning sound.
      const outsideGrid =
        next[0] < 0 ||
        next[0] >= env.rows ||
        next[1] < 0 ||
        next[1] >= env.cols;

      if (outsideGrid) {
        void playSound("blocked", soundSettings);

        const reward = Number(env.obstacle_penalty ?? -10);
        const newTotal = currentTotal + reward;
        const newMoveCount = currentMoves + 1;

        setTotalReward(newTotal);
        setMoves(newMoveCount);

        setRewardHistory((previous) => [
          ...previous,
          {
            move: newMoveCount,
            action,
            from: [...currentPosition],
            to: [...currentPosition],
            reward,
            total: newTotal,
            event: "Boundary hit",
          },
        ]);

        return;
      }

      let event = "Normal move";
      let reward = Number(env.step_reward ?? -1);
      let nextPosition = next;

      const isObstacle = contains(env.obstacles, next);
      const isGoal = sameCell(next, env.goal);
      const isWater = contains(env.water_cells, next);
      const isHighCost = contains(env.high_cost_cells, next);

      if (isObstacle) {
        event = "Obstacle hit";
        reward = Number(env.obstacle_penalty ?? -10);
        nextPosition = [...currentPosition];

        void playSound("blocked", soundSettings);
      } else if (isGoal) {
        event = "Goal reached";
        reward = Number(env.goal_reward ?? 100);

        void playSound("success", soundSettings);
      } else {
        void playSound("move", soundSettings);

        if (isWater) {
          event = "Water";
          reward = Number(env.water_penalty ?? -8);
        } else if (isHighCost) {
          event = "High-cost terrain";
          reward = Number(env.high_cost_penalty ?? -5);
        }
      }

      const newTotal = currentTotal + reward;
      const newMoveCount = currentMoves + 1;

      setPosition(nextPosition);
      setTotalReward(newTotal);
      setMoves(newMoveCount);

      setRewardHistory((previous) => [
        ...previous,
        {
          move: newMoveCount,
          action,
          from: [...currentPosition],
          to: [...nextPosition],
          reward,
          total: newTotal,
          event,
        },
      ]);

      if (isGoal) {
        setFinished(true);
      }
    },
    [setPosition, soundEnabled, soundVolume]
  );

  // Keyboard arrow controls.
  useEffect(() => {
    function handleKeyDown(event) {
      const keyMap = {
        ArrowUp: [-1, 0],
        ArrowDown: [1, 0],
        ArrowLeft: [0, -1],
        ArrowRight: [0, 1],
      };

      const direction = keyMap[event.key];
      if (!direction) return;

      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
            target.tagName
          ))
      ) {
        return;
      }

      event.preventDefault();
      moveAgent(...direction);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [moveAgent]);

  return (
    <section className="manual-play panel" id="manual-play">
      <div className="section-heading manual-heading">
        <div>
          <span className="eyebrow">03 / MANUAL CONTROL</span>
          <h3>Play the environment</h3>
        </div>

        <span className={`small-pill ${finished ? "goal-pill" : ""}`}>
          {finished ? "Goal reached" : "Your turn"}
        </span>
      </div>

      <p className="muted">
        Use the direction buttons or keyboard arrow keys. Watch the
        agent move on the navigation grid above and track each reward.
      </p>

      <div className="manual-stats">
        <article>
          <span>Current position</span>
          <strong>
            ({position[0]}, {position[1]})
          </strong>
        </article>

        <article>
          <span>Moves / attempts</span>
          <strong>{moves}</strong>
        </article>

        <article>
          <span>Total episode reward</span>
          <strong className={totalReward < 0 ? "negative-reward" : ""}>
            {totalReward > 0 ? "+" : ""}
            {totalReward}
          </strong>
        </article>
      </div>

      <div className="manual-controls" aria-label="Agent movement controls">
        <button
          type="button"
          onClick={() => moveAgent(-1, 0)}
          disabled={finished}
          aria-label="Move up"
          title="Move up"
        >
          ↑
        </button>

        <div className="manual-horizontal-controls">
          <button
            type="button"
            onClick={() => moveAgent(0, -1)}
            disabled={finished}
            aria-label="Move left"
            title="Move left"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => moveAgent(1, 0)}
            disabled={finished}
            aria-label="Move down"
            title="Move down"
          >
            ↓
          </button>

          <button
            type="button"
            onClick={() => moveAgent(0, 1)}
            disabled={finished}
            aria-label="Move right"
            title="Move right"
          >
            →
          </button>
        </div>

        <p className="control-hint">
          Obstacle or boundary collisions play a warning sound and record
          the penalty. The agent stays in its current cell.
        </p>
      </div>

      {finished && (
        <div className="manual-success" role="status">
          <strong>Destination reached!</strong>
          <p>
            Goal reward: +{Number(environment.goal_reward ?? 100)}.
          </p>
          <p>
            Total episode reward: {totalReward > 0 ? "+" : ""}
            {totalReward}. Reset to start a new episode.
          </p>
        </div>
      )}

      <div className="manual-history">
        <div className="section-heading">
          <h3>Reward history</h3>

          <button
            className="text-button"
            type="button"
            onClick={resetEpisode}
          >
            Reset episode
          </button>
        </div>

        {rewardHistory.length === 0 ? (
          <div className="empty-state">
            Make your first move to begin tracking rewards.
          </div>
        ) : (
          <div className="reward-table-wrap">
            <table className="reward-table">
              <thead>
                <tr>
                  <th>Move</th>
                  <th>Action</th>
                  <th>Event</th>
                  <th>Reward</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {rewardHistory.map((item) => (
                  <tr key={item.move}>
                    <td>{item.move}</td>
                    <td>{item.action}</td>
                    <td>{item.event}</td>
                    <td
                      className={
                        item.reward < 0 ? "negative-reward" : ""
                      }
                    >
                      {item.reward > 0 ? "+" : ""}
                      {item.reward}
                    </td>
                    <td
                      className={
                        item.total < 0 ? "negative-reward" : ""
                      }
                    >
                      {item.total > 0 ? "+" : ""}
                      {item.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default ManualPlayground;
