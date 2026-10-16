
const TOOLS = [
  { id: "start", label: "Start", symbol: "S" },
  { id: "goal", label: "Goal", symbol: "G" },
  { id: "obstacle", label: "Obstacle", symbol: "×" },
  { id: "water", label: "Water", symbol: "≈" },
  { id: "high_cost", label: "High cost", symbol: "!" },
  { id: "normal", label: "Erase", symbol: "·" },
];

function EnvironmentEditor({
  environment,
  tool,
  setTool,
  onResize,
  gamma,
  setGamma,
  noise,
  setNoise,
  onReset,
}) {
  return (
    <aside className="panel editor-panel" id="environment">
      <div className="section-heading">
        <div>
          <span className="eyebrow">01 / CONFIGURE</span>
          <h3>Environment</h3>
        </div>

        <button className="text-button" onClick={onReset}>
          Reset
        </button>
      </div>

      <p className="muted">
        Select a tool, then click a grid cell.
      </p>

      <div className="tool-list">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            className={`tool-button ${
              tool === item.id ? "selected" : ""
            }`}
            onClick={() => setTool(item.id)}
          >
            <span className={`tool-symbol ${item.id}`}>
              {item.symbol}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="divider" />

      <label className="field-label">
        Grid rows
        <input
          type="number"
          min="2"
          max="30"
          value={environment.rows}
          onChange={(event) =>
            onResize("rows", event.target.value)
          }
        />
      </label>

      <label className="field-label">
        Grid columns
        <input
          type="number"
          min="2"
          max="30"
          value={environment.cols}
          onChange={(event) =>
            onResize("cols", event.target.value)
          }
        />
      </label>

      <div className="divider" />

      <label className="field-label" htmlFor="discount-factor">
        Discount factor γ
        <strong>{gamma.toFixed(2)}</strong>
      </label>

      <input
        id="discount-factor"
        className="range"
        type="range"
        min="0.1"
        max="0.99"
        step="0.01"
        value={gamma}
        onChange={(event) => setGamma(Number(event.target.value))}
      />

      <label className="field-label" htmlFor="transition-noise">
        Transition noise
        <strong>{Math.round(noise * 100)}%</strong>
      </label>

      <input
        id="transition-noise"
        className="range"
        type="range"
        min="0"
        max="0.6"
        step="0.05"
        value={noise}
        onChange={(event) => setNoise(Number(event.target.value))}
      />

      <p className="hint">
        Noise introduces a chance that the agent moves in an
        unintended direction.
      </p>
    </aside>
  );
}

export default EnvironmentEditor;
