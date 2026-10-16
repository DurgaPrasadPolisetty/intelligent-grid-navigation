
import { useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import EnvironmentEditor from "./components/EnvironmentEditor";
import GridWorld from "./components/GridWorld";
import AlgorithmSelector from "./components/AlgorithmSelector";
import MetricsCards from "./components/MetricsCards";
import ResultsPanel from "./components/ResultsPanel";
import ManualPlayground from "./components/ManualPlayground";
import AlgorithmComparison from "./components/AlgorithmComparison";
import Footer from "./components/Footer";

import { playSound } from "./utils/soundEffects";
import { runAlgorithm } from "./services/api";
import { createDefaultEnvironment, sameCell } from "./utils/gridUtils";

import "./App.css";

function App() {
  const [environment, setEnvironment] = useState(
    createDefaultEnvironment
  );

  const [manualPosition, setManualPosition] = useState(() => [
    ...createDefaultEnvironment().start,
  ]);

  const [tool, setTool] = useState("obstacle");
  const [algorithm, setAlgorithm] = useState("Value Iteration");

  const [gamma, setGamma] = useState(0.9);
  const [noise, setNoise] = useState(0);
  const [episodes, setEpisodes] = useState(2000);
  const [alpha, setAlpha] = useState(0.1);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.35);

  const soundSettings = {
    enabled: soundEnabled,
    volume: soundVolume,
  };

  function updateEnvironment(next) {
    setEnvironment(next);
    setManualPosition([...next.start]);
    setResult(null);
    setError("");
  }

  function editCell(row, col) {
    const cell = [row, col];
    const next = structuredClone(environment);

    if (tool === "start" && sameCell(cell, next.goal)) return;
    if (tool === "goal" && sameCell(cell, next.start)) return;

    if (
      !["start", "goal"].includes(tool) &&
      (sameCell(cell, next.start) || sameCell(cell, next.goal))
    ) {
      return;
    }

    const removeCell = (list) =>
      list.filter((item) => !sameCell(item, cell));

    next.obstacles = removeCell(next.obstacles);
    next.water_cells = removeCell(next.water_cells);
    next.high_cost_cells = removeCell(next.high_cost_cells);

    if (tool === "start") next.start = cell;
    if (tool === "goal") next.goal = cell;
    if (tool === "obstacle") next.obstacles.push(cell);
    if (tool === "water") next.water_cells.push(cell);
    if (tool === "high_cost") next.high_cost_cells.push(cell);

    updateEnvironment(next);
  }

  function resizeGrid(dimension, rawValue) {
    const value = Number(rawValue);

    if (!Number.isInteger(value) || value < 2 || value > 30) {
      return;
    }

    const next = structuredClone(environment);

    if (dimension === "rows") {
      if (next.start[0] >= value || next.goal[0] >= value) return;

      next.rows = value;
      next.obstacles = next.obstacles.filter(([r]) => r < value);
      next.water_cells = next.water_cells.filter(([r]) => r < value);
      next.high_cost_cells = next.high_cost_cells.filter(
        ([r]) => r < value
      );
    } else {
      if (next.start[1] >= value || next.goal[1] >= value) return;

      next.cols = value;
      next.obstacles = next.obstacles.filter(([, c]) => c < value);
      next.water_cells = next.water_cells.filter(([, c]) => c < value);
      next.high_cost_cells = next.high_cost_cells.filter(
        ([, c]) => c < value
      );
    }

    updateEnvironment(next);
  }

  function resetEnvironment() {
    updateEnvironment(createDefaultEnvironment());
    setTool("obstacle");
    setGamma(0.9);
    setNoise(0);
    setEpisodes(2000);
    setAlpha(0.1);
  }

  async function executeAlgorithm() {
    setLoading(true);
    setError("");
    setResult(null);

    void playSound("start", soundSettings);

    try {
      const config = {
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

      const data = await runAlgorithm(algorithm, config);
      setResult(data);

      const path = data?.path;
      const reachedGoal =
        Array.isArray(path) &&
        path.length > 0 &&
        sameCell(path[path.length - 1], environment.goal);

      void playSound(
        reachedGoal ? "complete" : "error",
        soundSettings
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not run the algorithm. Check that FastAPI is running."
      );

      void playSound("error", soundSettings);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <Navbar />
      <Hero />

      {/* Sound controls */}
      <section className="sound-settings panel" aria-label="Sound settings">
        <label className="sound-toggle">
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) =>
              setSoundEnabled(event.target.checked)
            }
          />
          Sound effects
        </label>

        <label className="sound-volume">
          <span>Volume: {Math.round(soundVolume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={soundVolume}
            disabled={!soundEnabled}
            onChange={(event) =>
              setSoundVolume(Number(event.target.value))
            }
            aria-label="Sound volume"
          />
        </label>

        <button
          type="button"
          disabled={!soundEnabled}
          onClick={() => void playSound("success", soundSettings)}
        >
          Test sound
        </button>
      </section>

      <section className="workspace">
        <EnvironmentEditor
          environment={environment}
          tool={tool}
          setTool={setTool}
          onResize={resizeGrid}
          gamma={gamma}
          setGamma={setGamma}
          noise={noise}
          setNoise={setNoise}
          onReset={resetEnvironment}
        />

        <div className="grid-column">
          <GridWorld
            environment={environment}
            result={result}
            manualPosition={manualPosition}
            onCellClick={editCell}
          />

          <AlgorithmSelector
            algorithm={algorithm}
            setAlgorithm={(next) => {
              setAlgorithm(next);
              setResult(null);
              setError("");
            }}
            episodes={episodes}
            setEpisodes={setEpisodes}
            alpha={alpha}
            setAlpha={setAlpha}
            onRun={executeAlgorithm}
            loading={loading}
          />

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>
      </section>

      <ManualPlayground
        environment={environment}
        position={manualPosition}
        setPosition={setManualPosition}
        soundEnabled={soundEnabled}
        soundVolume={soundVolume}
      />

      <AlgorithmComparison
        environment={environment}
        gamma={gamma}
        noise={noise}
        episodes={episodes}
        alpha={alpha}
      />

      <MetricsCards result={result} />

      <ResultsPanel result={result} algorithm={algorithm} />

      <Footer />
    </main>
  );
}

export default App;
