
from collections import deque


def find_grid_path(environment):
    """Return a shortest obstacle-free path, or None if unreachable."""
    start = tuple(environment.start)
    goal = tuple(environment.goal)
    obstacles = set(map(tuple, environment.obstacles))

    if start in obstacles or goal in obstacles:
        return None

    queue = deque([(start, [start])])
    visited = {start}

    directions = [
        (-1, 0),  # UP
        (1, 0),   # DOWN
        (0, -1),  # LEFT
        (0, 1),   # RIGHT
    ]

    while queue:
        (row, col), path = queue.popleft()

        if (row, col) == goal:
            return [list(cell) for cell in path]

        for dr, dc in directions:
            next_cell = (row + dr, col + dc)
            nr, nc = next_cell

            if not (0 <= nr < environment.rows and
                    0 <= nc < environment.cols):
                continue

            if next_cell in obstacles or next_cell in visited:
                continue

            visited.add(next_cell)
            queue.append((next_cell, path + [next_cell]))

    return None
