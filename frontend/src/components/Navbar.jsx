
function Navbar() {
  return (
    <header className="topbar">
      <a className="brand" href="#home">
        <span className="brand-mark">IG</span>
        <span className="brand-name">
          Grid<span>Lab.</span>
        </span>
      </a>

      <nav className="main-nav">
        <a href="#environment">Environment</a>
        <a href="#algorithms">Algorithms</a>
        <a href="#results">Results</a>
      </nav>

      <a className="nav-cta" href="#algorithms">
        Explore algorithms <span>↗</span>
      </a>
    </header>
  );
}

export default Navbar;
