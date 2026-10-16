
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function Heatmap({ result }) {
  const values = result?.values;

  if (!Array.isArray(values) || values.length === 0) {
    return (
      <div className="results-placeholder">
        Run an algorithm to calculate state values.
      </div>
    );
  }

  const flatValues = values.flat().filter(Number.isFinite);
  const min = Math.min(...flatValues);
  const max = Math.max(...flatValues);

  function getBackground(value) {
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const lightness = 96 - ratio * 28;
    return `hsl(88, 70%, ${lightness}%)`;
  }

  return (
    <div
      className="heatmap-grid"
      style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(0, 1fr))` }}
    >
      {values.map((row, r) =>
        row.map((value, c) => (
          <div
            className="heatmap-cell"
            key={`${r}-${c}`}
            style={{ background: getBackground(value) }}
            title={`State (${r}, ${c}): ${value}`}
          >
            <strong>{Number(value).toFixed(1)}</strong>
            <small>({r}, {c})</small>
          </div>
        ))
      )}
    </div>
  );
}

function TrainingChart({ result }) {
  const data = result?.learning_curve;

  if (result?.algorithm !== "Q-Learning" || !Array.isArray(data) || !data.length) {
    return (
      <div className="results-placeholder">
        Select Q-Learning and run training to see its learning curve.
      </div>
    );
  }

  return (
    <div className="training-chart">
      <ResponsiveContainer width="100%" height={270}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="episode"
            tick={{ fontSize: 11 }}
            label={{ value: "Episode", position: "insideBottom", offset: -4 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="average_reward"
            name="Average reward"
            stroke="#8bd83f"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function GeneratedRoute({ result }) {
  const path = result?.path;

  return (
    <section className="result-panel route-panel" id="route">
      <p className="eyebrow">06 / SOLUTION</p>
      <h2>Generated route</h2>
      <p className="section-description">
        The route is extracted from the selected algorithm's policy.
      </p>

      {!Array.isArray(path) || path.length === 0 ? (
        <div className="results-placeholder">
          Run an algorithm to generate a route.
        </div>
      ) : (
        <>
          <p className="route-summary">
            {path.length - 1} moves · {path.length} states visited
          </p>
          <div className="route-list">
            {path.map((cell, index) => (
              <span className="route-step" key={`${cell[0]}-${cell[1]}-${index}`}>
                ({cell[0]}, {cell[1]})
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function ResultsPanel({ result }) {
  const valueLabel =
    result?.algorithm === "Q-Learning"
      ? "Maximum learned Q-value per state"
      : "Estimated state value under the selected policy";

  return (
    <section className="results-layout" id="results">
      <article className="result-panel">
        <p className="eyebrow">04 / ANALYSIS</p>
        <h2>State-value heatmap</h2>
        <p className="section-description">
          {valueLabel}
        </p>
        <Heatmap result={result} />
        {result?.algorithm === "Q-Learning" && (
          <p className="result-note">
            Q-learning values are the highest learned action values for each
            state, not exact dynamic-programming state values.
          </p>
        )}
      </article>

      <article className="result-panel">
        <p className="eyebrow">05 / LEARNING</p>
        <h2>Training performance</h2>
        <p className="section-description">
          Episode rewards show how the Q-learning agent performs during training.
        </p>
        <TrainingChart result={result} />
      </article>

      <GeneratedRoute result={result} />

      {result && (
        <article className="result-panel convergence-panel">
          <p className="eyebrow">ALGORITHM STATUS</p>
          <h2>
            {result.algorithm === "Q-Learning"
              ? "Training completed"
              : result.converged
                ? "Converged"
                : "Iteration limit reached"}
          </h2>
          <p className="section-description">
            {result.algorithm === "Q-Learning"
              ? `Final exploration rate: ${result.final_epsilon ?? "—"}`
              : result.converged
                ? "The stopping criterion was satisfied."
                : "The algorithm stopped before confirming convergence."}
          </p>
        </article>
      )}
    </section>
  );
}
