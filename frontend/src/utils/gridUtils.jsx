
export function sameCell(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length >= 2 &&
    b.length >= 2 &&
    a[0] === b[0] &&
    a[1] === b[1]
  );
}

export function getCellType(environment, cell) {
  if (!environment || !Array.isArray(cell)) {
    return "normal";
  }

  if (sameCell(environment.start, cell)) return "start";
  if (sameCell(environment.goal, cell)) return "goal";

  if (
    (environment.obstacles ?? []).some((item) =>
      sameCell(item, cell)
    )
  ) {
    return "obstacle";
  }

  if (
    (environment.water_cells ?? []).some((item) =>
      sameCell(item, cell)
    )
  ) {
    return "water";
  }

  if (
    (environment.high_cost_cells ?? []).some((item) =>
      sameCell(item, cell)
    )
  ) {
    return "high_cost";
  }

  return "normal";
}

export function createDefaultEnvironment() {
  return {
    rows: 5,
    cols: 5,
    start: [0, 0],
    goal: [4, 4],
    obstacles: [[1, 1], [1, 3], [3, 3]],
    high_cost_cells: [[2, 2]],
    water_cells: [[2, 3]],
    step_reward: -1,
    goal_reward: 100,
    obstacle_penalty: -10,
    high_cost_penalty: -5,
    water_penalty: -8,
    transition_noise: 0,
  };
}
