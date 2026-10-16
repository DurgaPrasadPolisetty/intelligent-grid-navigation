
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { runAlgorithm } from "../services/api";

const ALGORITHMS = [
  "Value Iteration",
  "Policy Iteration",
  "Q-Learning",
];

function formatNumber(value, digits = 2) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : "—";
}

function sameCell(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a[0] === b[0] &&
    a[1] === b[1]
  );
}

function containsCell(cells, cell) {
  return (cells ?? []).some((item) => sameCell(item, cell));
}

// Check whether any four-directional route exists before calling the APIs.
// Obstacles block movement; water and high-cost cells remain traversable.
function isGoalReachable(environment) {
  const { rows, cols, start, goal } = environment;

  if (
    !Array.isArray(start) ||
    !Array.isArray(goal) ||
    containsCell(environment.obstacles, start) ||
    containsCell(environment.obstacles, goal)
  ) {
    return false;
  }

  const inBounds = ([row, col]) =>
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 && row < rows &&
    col >= 0 && col < cols;

  if (!inBounds(start) || !inBounds(goal)) return false;
  if (sameCell(start, goal)) return true;

  const key = ([row, col]) => `${row},${col}`;
  const blocked = new Set(
    (environment.obstacles ?? []).map((cell) => key(cell))
  );
  const visited = new Set([key(start)]);
  const queue = [[start[0], start[1]]];
  const directions = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  for (let head = 0; head < queue.length; head += 1) {
    const [row, col] = queue[head];

    for (const [dr, dc] of directions) {
      const next = [row + dr, col + dc];
      const nextKey = key(next);

      if (
        !inBounds(next) ||
        blocked.has(nextKey) ||
        visited.has(nextKey)
      ) {
        continue;
      }

      if (sameCell(next, goal)) return true;

      visited.add(nextKey);
      queue.push(next);
    }
  }

  return false;
}

function validatePath(path, environment) {
  if (!Array.isArray(path) || path.length === 0) {
    return { valid: false, reason: "No path returned" };
  }

  if (!sameCell(path[0], environment.start)) {
    return { valid: false, reason: "Wrong start cell" };
  }

  if (!sameCell(path[path.length - 1], environment.goal)) {
    return { valid: false, reason: "Goal not reached" };
  }

  for (let i = 0; i < path.length; i += 1) {
    const cell = path[i];

    if (
      !Array.isArray(cell) ||
      cell.length < 2 ||
      !Number.isInteger(cell[0]) ||
      !Number.isInteger(cell[1])
    ) {
      return { valid: false, reason: "Invalid coordinate" };
    }

    const [row, col] = cell;

    if (
      row < 0 ||
      row >= environment.rows ||
      col < 0 ||
      col >= environment.cols
    ) {
      return { valid: false, reason: "Outside grid" };
    }

    if (containsCell(environment.obstacles, cell)) {
      return { valid: false, reason: "Path crosses obstacle" };
    }

    if (i > 0) {
      const previous = path[i - 1];
      const distance =
        Math.abs(row - previous[0]) +
        Math.abs(col - previous[1]);

      if (distance !== 1) {
        return {
          valid: false,
          reason: "Non-adjacent movement",
        };
      }
    }
  }

  return { valid: true, reason: "Goal reached" };
}

// Calculate undiscounted path return using the configured reward
// for each entered cell. This is separate from training episode return.

function calculatePathReturn(path, environment) {
  if (!Array.isArray(path) || path.length < 2) {
    return null;
  }

  const rewards = environment.rewards ?? environment;

  const stepReward = Number(rewards.step_reward ?? rewards.step ?? -1);
  const goalReward = Number(rewards.goal_reward ?? rewards.goal ?? 100);
  const waterPenalty = Number(
    rewards.water_penalty ?? rewards.water ?? -8
  );
  const highCostPenalty = Number(
    rewards.high_cost_penalty ?? rewards.high_cost ?? -5
  );
  const obstaclePenalty = Number(
    rewards.obstacle_penalty ?? rewards.obstacle ?? -10
  );

  let total = 0;

  for (let i = 1; i < path.length; i += 1) {
    const cell = path[i];
    const previous = path[i - 1];

    if (
      !Array.isArray(cell) ||
      cell.length < 2 ||
      !Array.isArray(previous) ||
      previous.length < 2
    ) {
      return null;
    }

    const [row, col] = cell;

    if (
      !Number.isInteger(row) ||
      !Number.isInteger(col) ||
      row < 0 ||
      row >= environment.rows ||
      col < 0 ||
      col >= environment.cols
    ) {
      return null;
    }

    const distance =
      Math.abs(row - previous[0]) +
      Math.abs(col - previous[1]);

    if (distance !== 1) {
      return null;
    }

    if (containsCell(environment.obstacles, cell)) {
      // The route is invalid; do not calculate a misleading return.
      return null;
    }

    if (sameCell(cell, environment.goal)) {
      total += goalReward;
    } else if (containsCell(environment.water_cells, cell)) {
      total += waterPenalty;
    } else if (containsCell(environment.high_cost_cells, cell)) {
      total += highCostPenalty;
    } else {
      total += stepReward;
    }
  }

  return total;
}


function MetricBar({ value, maximum, colorClass = "" }) {
  const numericValue = Number(value);
  const width =
    Number.isFinite(numericValue) && maximum > 0
      ? Math.max(0, (numericValue / maximum) * 100)
      : 0;

  return (
    <div className="benchmark-bar-track">
      <div
        className={`benchmark-bar ${colorClass}`}
        style={{ width: `${Math.min(100, width)}%` }}
      />
    </div>
  );
}

function buildLearningCurve(rewards) {
  if (!Array.isArray(rewards) || rewards.length === 0) return [];

  const windowSize = Math.min(100, rewards.length);
  let rollingSum = 0;

  return rewards.map((reward, index) => {
    const value = Number(reward);
    const safeValue = Number.isFinite(value) ? value : 0;

    rollingSum += safeValue;

    if (index >= windowSize) {
      rollingSum -= Number(rewards[index - windowSize]) || 0;
    }

    const count = Math.min(index + 1, windowSize);

    return {
      episode: index + 1,
      episodeReward: safeValue,
      movingAverage: rollingSum / count,
    };
  });
}

function AlgorithmComparison({
  environment,
  gamma,
  noise,
  episodes,
  alpha,
}) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function compareAlgorithms() {
    setError("");
    setResults([]);

    if (!isGoalReachable(environment)) {
      setError(
        "Goal unreachable! Obstacles block every route from the start to the goal. Remove or reposition at least one obstacle, then compare the algorithms again."
      );
      return;
    }

    setLoading(true);

    const sharedConfig = {
      environment: {
        ...environment,
        transition_noise: Number(noise),
      },
      gamma: Number(gamma),
      theta: 0.000001,
      max_iterations: 1000,
      episodes: Number(episodes),
      alpha: Number(alpha),
      epsilon: 1,
      epsilon_decay: 0.995,
      min_epsilon: 0.02,
    };

    try {
      const outcomes = await Promise.all(
        ALGORITHMS.map(async (name) => {
          try {
            const result = await runAlgorithm(name, sharedConfig);
            const validation = validatePath(result.path, environment);

            return {
              name,
              result,
              validation,
              pathReturn: validation.valid
                ? calculatePathReturn(result.path, environment)
                : null,
              error: "",
            };
          } catch (err) {
            return {
              name,
              result: null,
              validation: { valid: false, reason: "Request failed" },
              pathReturn: null,
              error: err.message || "Algorithm request failed.",
            };
          }
        })
      );

      setResults(outcomes);

      if (outcomes.every((item) => !item.result)) {
        setError(
          "All algorithm requests failed. Check that FastAPI is running."
        );
      }
    } catch (err) {
      setError(err.message || "Comparison failed.");
    } finally {
      setLoading(false);
    }
  }

  const successful = results.filter((item) => item.result);

  const maxRuntime = Math.max(
    1,
    ...successful.map((item) => Number(item.result.runtime_ms) || 0)
  );

  const maxPathLength = Math.max(
    1,
    ...successful.map((item) =>
      Number(item.result.path_length) || 0
    )
  );

  const qLearning = successful.find(
    (item) => item.name === "Q-Learning"
  );

  const learningCurve = buildLearningCurve(
    qLearning?.result?.rewards_per_episode
  );

  return (
    <section className="benchmark-panel" id="comparison">
      <div className="benchmark-heading">
        <div>
          <span className="eyebrow">07 / BENCHMARK</span>
          <h2>Algorithm comparison</h2>
          <p>
            Evaluate all three algorithms on the current environment
            using the same configuration.
          </p>
        </div>

        <button
          className="benchmark-run-button"
          type="button"
          onClick={compareAlgorithms}
          disabled={loading}
        >
          {loading ? "Comparing algorithms…" : "Compare all algorithms"}
          {!loading && <span aria-hidden="true"> ↗</span>}
        </button>
      </div>

      <div className="benchmark-config">
        <span>
          <strong>Grid:</strong> {environment.rows} × {environment.cols}
        </span>
        <span>
          <strong>Discount γ:</strong> {formatNumber(gamma)}
        </span>
        <span>
          <strong>Noise:</strong> {formatNumber(Number(noise) * 100, 0)}%
        </span>
        <span>
          <strong>Q-Learning episodes:</strong> {episodes}
        </span>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {results.length === 0 && !loading ? (
        <div className="benchmark-empty">
          <span className="benchmark-empty-icon">↗</span>
          <strong>Ready to benchmark</strong>
          <p>
            Run the comparison to view execution time, validated paths,
            reward returns, and learning progress.
          </p>
        </div>
      ) : (
        <>
          <div className="benchmark-table-wrap">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Runtime</th>
                  <th>Iterations / episodes</th>
                  <th>Path length</th>
                  <th>Path return</th>
                  <th>Route validation</th>
                  <th>Algorithm status</th>
                </tr>
              </thead>

              <tbody>
                {results.map(
                  ({ name, result, validation, pathReturn, error: rowError }) => (
                    <tr key={name}>
                      <td><strong>{name}</strong></td>
                      <td>
                        {result
                          ? `${formatNumber(result.runtime_ms)} ms`
                          : "Failed"}
                      </td>
                      <td>
                        {result
                          ? name === "Q-Learning"
                            ? result.episodes ?? episodes
                            : result.iterations ?? "—"
                          : "—"}
                      </td>
                      <td>
                        {result && validation.valid
                          ? result.path_length ?? result.path.length - 1
                          : "—"}
                      </td>
                      <td>
                        {pathReturn === null
                          ? "—"
                          : formatNumber(pathReturn)}
                      </td>
                      <td>
                        <span
                          className={`benchmark-status ${
                            validation.valid ? "converged" : "incomplete"
                          }`}
                          title={validation.reason}
                        >
                          {result
                            ? validation.valid
                              ? "Valid route"
                              : validation.reason
                            : rowError || "Request failed"}
                        </span>
                      </td>
                      <td>
                        {!result ? (
                          <span className="benchmark-status failed">
                            Request failed
                          </span>
                        ) : name === "Q-Learning" ? (
                          <span className="benchmark-status trained">
                            Training completed
                          </span>
                        ) : (
                          <span
                            className={`benchmark-status ${
                              result.converged ? "converged" : "incomplete"
                            }`}
                          >
                            {result.converged
                              ? "Converged"
                              : "Not converged"}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {successful.length > 0 && (
            <div className="benchmark-charts">
              <article className="benchmark-chart-card">
                <h3>Execution time</h3>
                <p>Lower is faster for this run.</p>

                {successful.map(({ name, result }) => (
                  <div className="benchmark-bar-row" key={name}>
                    <div className="benchmark-bar-label">
                      <span>{name}</span>
                      <strong>{formatNumber(result.runtime_ms)} ms</strong>
                    </div>
                    <MetricBar
                      value={result.runtime_ms}
                      maximum={maxRuntime}
                    />
                  </div>
                ))}
              </article>

              <article className="benchmark-chart-card">
                <h3>Validated path length</h3>
                <p>Only routes that reach the goal are included.</p>

                {successful.map(({ name, result, validation }) => (
                  <div className="benchmark-bar-row" key={name}>
                    <div className="benchmark-bar-label">
                      <span>{name}</span>
                      <strong>
                        {validation.valid
                          ? `${result.path_length ?? result.path.length - 1} moves`
                          : "Invalid route"}
                      </strong>
                    </div>
                    <MetricBar
                      value={
                        validation.valid
                          ? result.path_length ?? result.path.length - 1
                          : 0
                      }
                      maximum={maxPathLength}
                      colorClass="lime"
                    />
                  </div>
                ))}
              </article>
            </div>
          )}

          <article className="benchmark-chart-card learning-curve-card">
            <div>
              <h3>Q-Learning reward progression</h3>
              <p>
                Episode reward and moving average over the last up to 100
                episodes. A rising moving average can indicate learning
                progress.
              </p>
            </div>

            {learningCurve.length > 0 ? (
              <div className="learning-chart">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart
                    data={learningCurve}
                    margin={{ top: 12, right: 20, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="episode"
                      type="number"
                      domain={[1, "dataMax"]}
                      tick={{ fontSize: 11 }}
                      label={{
                        value: "Episode",
                        position: "insideBottom",
                        offset: -2,
                      }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      width={55}
                      label={{
                        value: "Reward",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        formatNumber(value),
                        name === "episodeReward"
                          ? "Episode reward"
                          : "Moving average",
                      ]}
                      labelFormatter={(label) => `Episode ${label}`}
                    />
                    <Legend
                      formatter={(value) =>
                        value === "episodeReward"
                          ? "Episode reward"
                          : "Moving average"
                      }
                    />
                    <ReferenceLine y={0} stroke="#888" />
                    <Line
                      type="monotone"
                      dataKey="episodeReward"
                      name="episodeReward"
                      stroke="#9a9a9a"
                      dot={false}
                      strokeWidth={1}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="movingAverage"
                      name="movingAverage"
                      stroke="#65a832"
                      dot={false}
                      strokeWidth={2.5}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="benchmark-empty">
                <strong>Learning curve unavailable</strong>
                <p>
                  The API did not return rewards_per_episode. Confirm that
                  the Q-Learning endpoint includes that array.
                </p>
              </div>
            )}
          </article>

          <div className="benchmark-routes">
            <h3>Generated routes</h3>

            <div className="benchmark-route-grid">
              {results.map(({ name, result, validation, error: rowError }) => (
                <article className="benchmark-route-card" key={name}>
                  <h4>{name}</h4>

                  {!result ? (
                    <p className="muted">
                      {rowError || "No result available."}
                    </p>
                  ) : (
                    <>
                      <p className="benchmark-route-summary">
                        {validation.valid
                          ? `${result.path_length ?? result.path.length - 1} moves · Goal reached`
                          : `Route invalid · ${validation.reason}`}
                      </p>

                      {Array.isArray(result.path) && result.path.length > 0 && (
                        <div className="benchmark-route-list">
                          {result.path.map((cell, index) => (
                            <span key={`${cell[0]}-${cell[1]}-${index}`}>
                              ({cell[0]}, {cell[1]})
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="benchmark-route-return">
                        Calculated path return:{" "}
                        {validation.valid
                          ? formatNumber(
                              calculatePathReturn(result.path, environment)
                            )
                          : "Not calculated"}
                      </p>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>

          <p className="benchmark-note">
            Path return is calculated from entered cells using the configured
            undiscounted rewards. It is not the same as discounted value or
            Q-Learning training return. Runtime and iteration counts depend
            on the algorithm and machine.
          </p>
        </>
      )}
    </section>
  );
}

export default AlgorithmComparison;
