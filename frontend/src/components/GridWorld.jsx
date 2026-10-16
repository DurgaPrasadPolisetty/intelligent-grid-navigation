
import { useMemo } from "react";
import { getCellType, sameCell } from "../utils/gridUtils";

const ACTION_SYMBOLS = {
  UP: "↑",
  DOWN: "↓",
  LEFT: "←",
  RIGHT: "→",
  U: "↑",
  D: "↓",
  L: "←",
  R: "→",
};

function getPolicySymbol(policyCell) {
  if (typeof policyCell !== "string") return "";

  const normalized = policyCell.trim().toUpperCase();
  return ACTION_SYMBOLS[normalized] ?? policyCell;
}

function getValue(values, row, col) {
  const value = values?.[row]?.[col];

  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(1)
    : "—";
}

function getDirection(current, next) {
  if (!current || !next) return "";

  const [row, col] = current;
  const [nextRow, nextCol] = next;

  if (nextRow < row) return "↑";
  if (nextRow > row) return "↓";
  if (nextCol < col) return "←";
  if (nextCol > col) return "→";

  return "";
}

function GridWorld({
  environment,
  result,
  manualPosition,
  onCellClick,
}) {
  const path = Array.isArray(result?.path) ? result.path : [];
  const values = result?.values ?? [];
  const policy = result?.policy ?? [];

  // Get the configured goal reward, with 100 as the fallback.
  const goalReward = environment?.rewards?.goal ?? 100;

  // Map each route coordinate to its step number for quick lookup.
  const routeSteps = useMemo(() => {
    const steps = new Map();

    path.forEach((cell, index) => {
      if (Array.isArray(cell) && cell.length >= 2) {
        steps.set(`${cell[0]},${cell[1]}`, index);
      }
    });

    return steps;
  }, [path]);

  const validRoute =
    path.length > 0 &&
    sameCell(path[0], environment.start) &&
    sameCell(path[path.length - 1], environment.goal);

  return (
    <section className="grid-panel panel">
      <div className="grid-panel-heading">
        <div>
          <span className="eyebrow">ENVIRONMENT / STATE SPACE</span>
          <h2>Navigation grid</h2>
        </div>

        <span className="small-pill">
          {environment.rows * environment.cols} cells
        </span>
      </div>

      <p className="grid-instructions">
        Edit cells with the Environment Editor. Run an algorithm to
        highlight its route, or use the manual controls to move the agent.
      </p>

      {result && (
        <div
          className={`route-status ${
            validRoute ? "route-found" : "route-incomplete"
          }`}
          role="status"
        >
          <span className="route-status-dot" />

          <div>
            <strong>
              {validRoute ? "Route found" : "Route incomplete"}
            </strong>

            <p>
              {validRoute
                ? `${path.length - 1} moves from start to goal`
                : "This result does not contain a complete route to the goal."}
            </p>
          </div>
        </div>
      )}

      <div className="grid-scroll">
        <div
          className="navigation-grid"
          style={{
            gridTemplateColumns: `repeat(${environment.cols}, minmax(58px, 1fr))`,
          }}
          role="grid"
          aria-label="Grid navigation environment"
        >
          {Array.from({ length: environment.rows }, (_, row) =>
            Array.from({ length: environment.cols }, (_, col) => {
              const cell = [row, col];
              const key = `${row},${col}`;
              const type = getCellType(environment, cell);

              const isStart = sameCell(cell, environment.start);
              const isGoal = sameCell(cell, environment.goal);
              const isAgent =
                manualPosition && sameCell(cell, manualPosition);

              const stepIndex = routeSteps.get(key);
              const isPathCell = stepIndex !== undefined;

              const nextCell = path[stepIndex + 1];
              const direction = getDirection(cell, nextCell);

              const policySymbol = getPolicySymbol(
                policy?.[row]?.[col]
              );

              const cellValue = getValue(values, row, col);

              const classes = [
                "navigation-cell",
                `cell-${type}`,
                isPathCell ? "cell-on-path" : "",
                isPathCell && stepIndex === 0 ? "route-first" : "",
                isPathCell && stepIndex === path.length - 1
                  ? "route-last"
                  : "",
                isAgent ? "cell-agent-position" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-label={`Cell ${row}, ${col}: ${type}${
                    isPathCell ? `, route step ${stepIndex}` : ""
                  }${isAgent ? ", agent position" : ""}${
                    isGoal ? `, goal reward ${goalReward}` : ""
                  }`}
                  className={classes}
                  onClick={() => onCellClick?.(row, col)}
                  title={
                    isGoal
                      ? `Goal cell — reward: +${goalReward}, state value: ${cellValue}`
                      : isPathCell
                        ? `Route step ${stepIndex}: (${row}, ${col})`
                        : `Row ${row}, column ${col} — ${type}`
                  }
                >
                  <span className="cell-coordinate">
                    {row}, {col}
                  </span>

                  <span className="cell-symbol">
                    {isAgent ? (
                      <span
                        className="agent-marker"
                        title="Current agent"
                      >
                        A
                      </span>
                    ) : isStart ? (
                      "S"
                    ) : isGoal ? (
                      "G"
                    ) : type === "obstacle" ? (
                      "×"
                    ) : type === "water" ? (
                      "≈"
                    ) : type === "high_cost" ? (
                      "!"
                    ) : isPathCell ? (
                      direction || (stepIndex === 0 ? "S" : "•")
                    ) : (
                      policySymbol
                    )}
                  </span>

                  {isPathCell && !isStart && !isGoal && (
                    <span className="route-step-number">
                      {stepIndex}
                    </span>
                  )}

                  {isGoal && (
                    <span className="goal-reward-label">
                      +{goalReward} reward
                    </span>
                  )}

                  <span className="cell-value">
                    {cellValue}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="grid-legend">
        <span>
          <i className="legend-dot legend-start" /> Start
        </span>
        <span>
          <i className="legend-dot legend-goal" /> Goal
        </span>
        <span>
          <i className="legend-dot legend-agent" /> Agent
        </span>
        <span>
          <i className="legend-dot legend-obstacle" /> Obstacle
        </span>
        <span>
          <i className="legend-dot legend-water" /> Water
        </span>
        <span>
          <i className="legend-dot legend-high-cost" /> High cost
        </span>
        <span>
          <i className="legend-dot legend-route" /> Algorithm route
        </span>
      </div>

      {result && (
        <div className="grid-result-note">
          <strong>Route visualization</strong>

          <span>
            Arrows indicate the next route direction. Small numbers
            indicate route steps. Cell values show the algorithm's
            state-value estimates, while the goal label shows the
            reward for entering the goal.
          </span>
        </div>
      )}
    </section>
  );
}

export default GridWorld;
