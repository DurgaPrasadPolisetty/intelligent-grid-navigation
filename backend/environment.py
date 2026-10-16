
from __future__ import annotations

from typing import Any

import numpy as np


ACTIONS = ["UP", "DOWN", "LEFT", "RIGHT"]

ACTION_DELTAS = {
    "UP": (-1, 0),
    "DOWN": (1, 0),
    "LEFT": (0, -1),
    "RIGHT": (0, 1),
}


class GridEnvironment:
    """Finite grid Markov Decision Process for navigation algorithms."""

    def __init__(
        self,
        rows: int = 5,
        cols: int = 5,
        start: tuple[int, int] = (0, 0),
        goal: tuple[int, int] = (4, 4),
        obstacles: list[tuple[int, int]] | None = None,
        high_cost_cells: list[tuple[int, int]] | None = None,
        water_cells: list[tuple[int, int]] | None = None,
        step_reward: float = -1.0,
        goal_reward: float = 100.0,
        obstacle_penalty: float = -10.0,
        high_cost_penalty: float = -5.0,
        water_penalty: float = -8.0,
        transition_noise: float = 0.0,
    ):
        # Validate grid dimensions.
        if (
            isinstance(rows, bool)
            or not isinstance(rows, (int, np.integer))
            or rows < 2
        ):
            raise ValueError("Rows must be an integer of at least 2.")

        if (
            isinstance(cols, bool)
            or not isinstance(cols, (int, np.integer))
            or cols < 2
        ):
            raise ValueError("Columns must be an integer of at least 2.")

        if not np.isfinite(transition_noise) or not (
            0 <= transition_noise <= 1
        ):
            raise ValueError(
                "transition_noise must be between 0 and 1."
            )

        self.rows = int(rows)
        self.cols = int(cols)

        self.start = self._validate_cell(start, "start")
        self.goal = self._validate_cell(goal, "goal")

        self.obstacles = {
            self._validate_cell(cell, "obstacle")
            for cell in (obstacles or [])
        }

        self.high_cost_cells = {
            self._validate_cell(cell, "high-cost cell")
            for cell in (high_cost_cells or [])
        }

        self.water_cells = {
            self._validate_cell(cell, "water cell")
            for cell in (water_cells or [])
        }

        # Validate start and goal.
        if self.start == self.goal:
            raise ValueError("Start and goal must be different.")

        if self.start in self.obstacles:
            raise ValueError("Start cannot be an obstacle.")

        if self.goal in self.obstacles:
            raise ValueError("Goal cannot be an obstacle.")

        # Validate terrain overlaps.
        if self.obstacles & self.high_cost_cells:
            raise ValueError(
                "Obstacle and high-cost cells cannot overlap."
            )

        if self.obstacles & self.water_cells:
            raise ValueError(
                "Obstacle and water cells cannot overlap."
            )

        if self.high_cost_cells & self.water_cells:
            raise ValueError(
                "Water and high-cost cells cannot overlap."
            )

        self.step_reward = self._validate_reward(
            step_reward, "step_reward"
        )
        self.goal_reward = self._validate_reward(
            goal_reward, "goal_reward"
        )
        self.obstacle_penalty = self._validate_reward(
            obstacle_penalty, "obstacle_penalty"
        )
        self.high_cost_penalty = self._validate_reward(
            high_cost_penalty, "high_cost_penalty"
        )
        self.water_penalty = self._validate_reward(
            water_penalty, "water_penalty"
        )

        self.transition_noise = float(transition_noise)

        self.n_states = self.rows * self.cols
        self.n_actions = len(ACTIONS)

        self.start_state = self.to_state(self.start)
        self.goal_state = self.to_state(self.goal)

    @staticmethod
    def _validate_reward(value: float, name: str) -> float:
        """Ensure reward values are finite numbers."""
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float, np.integer, np.floating))
            or not np.isfinite(value)
        ):
            raise ValueError(f"{name} must be a finite number.")

        return float(value)

    def _validate_cell(
        self,
        cell: tuple[int, int],
        name: str,
    ) -> tuple[int, int]:
        """Validate and normalize a grid coordinate."""
        if not isinstance(cell, (tuple, list)) or len(cell) != 2:
            raise ValueError(
                f"{name} must contain a row and column."
            )

        row, col = cell

        if (
            isinstance(row, bool)
            or isinstance(col, bool)
            or not isinstance(row, (int, np.integer))
            or not isinstance(col, (int, np.integer))
        ):
            raise ValueError(
                f"{name} coordinates must be integers."
            )

        if not (
            0 <= row < self.rows
            and 0 <= col < self.cols
        ):
            raise ValueError(
                f"{name} {cell} is outside the grid."
            )

        return int(row), int(col)

    def to_state(self, position: tuple[int, int]) -> int:
        """Convert (row, column) to a state index."""
        row, col = self._validate_cell(position, "position")
        return row * self.cols + col

    def to_position(self, state: int) -> tuple[int, int]:
        """Convert a state index to (row, column)."""
        if (
            isinstance(state, bool)
            or not isinstance(state, (int, np.integer))
            or not 0 <= state < self.n_states
        ):
            raise ValueError(f"Invalid state: {state}")

        return divmod(int(state), self.cols)

    def is_terminal(self, state: int) -> bool:
        """Return whether the state is the goal state."""
        return state == self.goal_state

    def reward_for(self, position: tuple[int, int]) -> float:
        """Return the reward associated with entering a cell."""
        position = self._validate_cell(position, "position")

        if position == self.goal:
            return self.goal_reward

        if position in self.high_cost_cells:
            return self.high_cost_penalty

        if position in self.water_cells:
            return self.water_penalty

        return self.step_reward

    def _move(
        self,
        position: tuple[int, int],
        action: str,
    ) -> tuple[int, int]:
        """Apply an action while respecting boundaries and obstacles."""
        if action not in ACTION_DELTAS:
            raise ValueError(f"Unknown action: {action}")

        row, col = position
        delta_row, delta_col = ACTION_DELTAS[action]

        candidate = (
            row + delta_row,
            col + delta_col,
        )

        next_row, next_col = candidate

        # Boundary collision: remain in the same cell.
        if not (
            0 <= next_row < self.rows
            and 0 <= next_col < self.cols
        ):
            return position

        # Obstacle collision: remain in the same cell.
        if candidate in self.obstacles:
            return position

        return candidate

    def transition_outcomes(
        self,
        state: int,
        action: str,
    ) -> list[tuple[float, int, float]]:
        """
        Return possible transitions as (probability, next_state, reward).

        With zero noise, the requested action is deterministic.
        Otherwise, the requested action has probability 1 - noise,
        and each alternative action has probability noise / 3.

        Obstacle collisions receive obstacle_penalty.
        Boundary collisions receive the normal step reward.
        Entering the goal receives goal_reward.
        """
        if action not in ACTIONS:
            raise ValueError(f"Unknown action: {action}")

        # Validate the state even when it is terminal.
        position = self.to_position(state)

        # The goal is terminal and has no future reward.
        if self.is_terminal(state):
            return [(1.0, state, 0.0)]

        noise = self.transition_noise

        action_probabilities = {
            candidate_action: (
                1.0 - noise
                if candidate_action == action
                else noise / 3.0
            )
            for candidate_action in ACTIONS
        }

        # Merge outcomes that lead to the same state and reward.
        outcomes: dict[tuple[int, float], float] = {}

        for actual_action, probability in action_probabilities.items():
            if probability <= 0:
                continue

            delta_row, delta_col = ACTION_DELTAS[actual_action]

            candidate = (
                position[0] + delta_row,
                position[1] + delta_col,
            )

            in_bounds = (
                0 <= candidate[0] < self.rows
                and 0 <= candidate[1] < self.cols
            )

            hit_obstacle = (
                in_bounds and candidate in self.obstacles
            )

            next_position = self._move(
                position,
                actual_action,
            )

            if hit_obstacle:
                reward = self.obstacle_penalty
            else:
                reward = self.reward_for(next_position)

            next_state = self.to_state(next_position)
            key = (next_state, reward)

            outcomes[key] = (
                outcomes.get(key, 0.0) + probability
            )

        return [
            (probability, next_state, reward)
            for (next_state, reward), probability in outcomes.items()
        ]

    def to_dict(self) -> dict[str, Any]:
        """Serialize the environment for API responses."""
        def cells(
            items: set[tuple[int, int]],
        ) -> list[list[int]]:
            return [
                list(cell)
                for cell in sorted(items)
            ]

        return {
            "rows": self.rows,
            "cols": self.cols,
            "start": list(self.start),
            "goal": list(self.goal),
            "obstacles": cells(self.obstacles),
            "high_cost_cells": cells(self.high_cost_cells),
            "water_cells": cells(self.water_cells),
            "transition_noise": self.transition_noise,
            "rewards": {
                "step": self.step_reward,
                "goal": self.goal_reward,
                "obstacle": self.obstacle_penalty,
                "high_cost": self.high_cost_penalty,
                "water": self.water_penalty,
            },
        }

    def to_grid(self) -> list[list[str]]:
        """Return a grid of cell types for visualization."""
        grid = [
            ["normal" for _ in range(self.cols)]
            for _ in range(self.rows)
        ]

        for row, col in self.obstacles:
            grid[row][col] = "obstacle"

        for row, col in self.high_cost_cells:
            grid[row][col] = "high_cost"

        for row, col in self.water_cells:
            grid[row][col] = "water"

        grid[self.start[0]][self.start[1]] = "start"
        grid[self.goal[0]][self.goal[1]] = "goal"

        return grid
