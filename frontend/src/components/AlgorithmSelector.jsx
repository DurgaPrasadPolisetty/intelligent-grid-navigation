
const ALGORITHMS = [
  {
    name: "Value Iteration",
    description: "Bellman optimization",
  },
  {
    name: "Policy Iteration",
    description: "Evaluate + improve",
  },
  {
    name: "Q-Learning",
    description: "Learn from experience",
  },
];

function AlgorithmSelector({
  algorithm,
  setAlgorithm,
  episodes,
  setEpisodes,
  alpha,
  setAlpha,
  onRun,
  loading,
}) {
  const isQLearning = algorithm === "Q-Learning";

  return (
    <section className="algorithm-box" id="algorithms">
      <div className="section-heading">
        <div>
          <span className="eyebrow">03 / SOLVER</span>
          <h3>Decision engine</h3>
        </div>
      </div>

      <div className="algorithm-options">
        {ALGORITHMS.map((item) => (
          <button
            key={item.name}
            type="button"
            className={`algorithm-option ${
              algorithm === item.name ? "active" : ""
            }`}
            onClick={() => setAlgorithm(item.name)}
          >
            <span>{item.name}</span>
            <small>{item.description}</small>
          </button>
        ))}
      </div>

      {isQLearning && (
        <div className="q-controls">
          <label className="field-label" htmlFor="episodes">
            Training episodes
            <strong>{episodes.toLocaleString()}</strong>
          </label>

          <input
            id="episodes"
            className="range"
            type="range"
            min="100"
            max="10000"
            step="100"
            value={episodes}
            onChange={(event) =>
              setEpisodes(Number(event.target.value))
            }
          />

          <label className="field-label" htmlFor="learning-rate">
            Learning rate α
            <strong>{alpha.toFixed(2)}</strong>
          </label>

          <input
            id="learning-rate"
            className="range"
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={alpha}
            onChange={(event) =>
              setAlpha(Number(event.target.value))
            }
          />
        </div>
      )}

      <button
        type="button"
        className="run-button"
        onClick={onRun}
        disabled={loading}
      >
        {loading
          ? "Computing policy..."
          : `▶ Run ${algorithm}`}
      </button>
    </section>
  );
}

export default AlgorithmSelector;
