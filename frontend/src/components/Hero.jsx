
function Hero() {
  const path = new Set([
    "0,0", "0,1", "0,2", "1,2",
    "2,2", "3,2", "4,2", "4,3", "4,4",
  ]);

  const obstacles = new Set(["1,1", "1,3", "3,3"]);

  return (
    <section className="hero" id="home">
      <div className="hero-copy">
        <span className="eyebrow">
          INTELLIGENT SYSTEMS / RESEARCH LAB
        </span>

        <h2>
          Navigate the
          <br />
          <span className="highlight">unknown.</span>
          <br />
          Find the optimal path.
        </h2>

        <p>
          Explore how intelligent agents solve grid environments
          using finite Markov Decision Processes, Dynamic
          Programming, and Reinforcement Learning.
        </p>

        <div className="hero-actions">
          <a className="hero-primary" href="#environment">
            Explore the grid <span>↘</span>
          </a>

          <a className="hero-secondary" href="#algorithms">
            Discover algorithms ↗
          </a>
        </div>

        <div className="hero-proof">
          <span><i /> 3 intelligent algorithms</span>
          <span><i /> One shared environment</span>
        </div>
      </div>

      <div
        className="hero-art"
        role="img"
        aria-label="Illustration of an agent navigating a grid"
      >
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />

        <div className="art-tag tag-top">STATE → ACTION</div>

        <div className="art-grid">
          {Array.from({ length: 25 }, (_, index) => {
            const row = Math.floor(index / 5);
            const col = index % 5;
            const key = `${row},${col}`;

            return (
              <div
                key={key}
                className={[
                  "art-cell",
                  obstacles.has(key) ? "blocked" : "",
                  path.has(key) ? "art-path" : "",
                  key === "0,0" ? "art-start" : "",
                  key === "4,4" ? "art-goal" : "",
                ].join(" ")}
              >
                {key === "0,0" ? "S" :
                 key === "4,4" ? "G" :
                 obstacles.has(key) ? "×" :
                 path.has(key) ? "·" : ""}
              </div>
            );
          })}
        </div>

        <div className="art-tag tag-bottom">OPTIMIZE / REPEAT</div>

        <div className="floating-chip chip-one">
          π* <span>Optimal policy</span>
        </div>

        <div className="floating-chip chip-two">
          V(s) <span>State value</span>
        </div>

        <div className="art-spark" aria-hidden="true">✳</div>
      </div>
    </section>
  );
}

export default Hero;
