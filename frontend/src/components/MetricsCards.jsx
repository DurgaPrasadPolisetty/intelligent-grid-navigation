
function MetricCard({ label, value, description }) {
  return (
    <article className="metric-card">
      <p className="metric-label">{label}</p>
      <h3>{value}</h3>
      <p className="metric-description">{description}</p>
    </article>
  );
}

export default function MetricsCards({ result }) {
  if (!result) {
    return (
      <section className="metrics-grid" aria-label="Algorithm metrics">
        <MetricCard
          label="Algorithm"
          value="—"
          description="Run an algorithm to begin"
        />
        <MetricCard
          label="Iterations / Episodes"
          value="—"
          description="Work performed"
        />
        <MetricCard
          label="Path length"
          value="—"
          description="Moves to goal"
        />
        <MetricCard
          label="Runtime"
          value="—"
          description="Backend execution time"
        />
      </section>
    );
  }

  const work =
    result.algorithm === "Q-Learning"
      ? `${result.episodes ?? "—"}`
      : `${result.iterations ?? "—"}`;

  const workLabel =
    result.algorithm === "Q-Learning"
      ? "Training episodes completed"
      : result.converged
        ? "Converged"
        : "Iterations performed";

  return (
    <section className="metrics-grid" aria-label="Algorithm metrics">
      <MetricCard
        label="Algorithm"
        value={result.algorithm ?? "—"}
        description="Selected solver"
      />
      <MetricCard
        label="Iterations / Episodes"
        value={work}
        description={workLabel}
      />
      <MetricCard
        label="Path length"
        value={
          Number.isFinite(result.path_length)
            ? result.path_length
            : "—"
        }
        description="Moves to goal"
      />
      <MetricCard
        label="Runtime"
        value={
          Number.isFinite(result.runtime_ms)
            ? `${result.runtime_ms} ms`
            : "—"
        }
        description="Backend execution time"
      />
    </section>
  );
}
