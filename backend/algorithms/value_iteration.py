
import time

import numpy as np

from environment import ACTIONS


def extract_path(env, policy, max_steps=None):
    """
    Follow a deterministic policy from start to goal.

    For stochastic environments, use the most likely transition outcome
    for visualization. The displayed path is not a guarantee of success
    under every possible stochastic transition.
    """
    max_steps = env.n_states * 2 if max_steps is None else max_steps

    if max_steps < 1:
        raise ValueError("max_steps must be positive.")

    policy = np.asarray(policy)

    if policy.size != env.n_states:
        raise ValueError("Policy must contain one action per state.")

    state = env.start_state
    path = [list(env.to_position(state))]
    visited = {state}

    for _ in range(max_steps):
        if env.is_terminal(state):
            break

        action_index = int(policy[state])

        if not 0 <= action_index < len(ACTIONS):
            break

        action = ACTIONS[action_index]
        outcomes = env.transition_outcomes(state, action)

        if not outcomes:
            break

        # Select the most probable outcome for the displayed route.
        _, next_state, _ = max(outcomes, key=lambda outcome: outcome[0])

        if next_state in visited and not env.is_terminal(next_state):
            break

        state = next_state
        path.append(list(env.to_position(state)))
        visited.add(state)

    return path


def value_iteration(
    env,
    gamma=0.9,
    theta=1e-6,
    max_iterations=1000,
):
    """Calculate optimal state values and a greedy policy."""
    if not 0 <= gamma < 1:
        raise ValueError("gamma must be in [0, 1).")

    if theta <= 0:
        raise ValueError("theta must be positive.")

    if max_iterations < 1:
        raise ValueError("max_iterations must be positive.")

    started = time.perf_counter()

    values = np.zeros(env.n_states, dtype=float)
    policy = np.zeros(env.n_states, dtype=int)
    converged = False
    delta = float("inf")
    iteration = 0

    for iteration in range(1, max_iterations + 1):
        delta = 0.0

        for state in range(env.n_states):
            if env.is_terminal(state):
                # Terminal states have no future value.
                values[state] = 0.0
                continue

            action_values = []

            for action in ACTIONS:
                expected_value = sum(
                    probability * (
                        reward + gamma * values[next_state]
                    )
                    for probability, next_state, reward
                    in env.transition_outcomes(state, action)
                )

                action_values.append(expected_value)

            best_value = max(action_values)
            delta = max(delta, abs(best_value - values[state]))
            values[state] = best_value

        if delta < theta:
            converged = True
            break

    # Extract a greedy policy using the final value estimates.
    for state in range(env.n_states):
        if env.is_terminal(state):
            policy[state] = 0
            continue

        action_values = [
            sum(
                probability * (
                    reward + gamma * values[next_state]
                )
                for probability, next_state, reward
                in env.transition_outcomes(state, action)
            )
            for action in ACTIONS
        ]

        policy[state] = int(np.argmax(action_values))

    path = extract_path(env, policy)
    path_found = (
        len(path) > 0
        and tuple(path[0]) == tuple(env.start)
        and tuple(path[-1]) == tuple(env.goal)
    )

    elapsed_ms = (time.perf_counter() - started) * 1000

    return {
        "algorithm": "Value Iteration",
        "converged": converged,
        "iterations": iteration,
        "final_delta": round(float(delta), 8),
        "runtime_ms": round(elapsed_ms, 3),
        "values": values.reshape(
            env.rows, env.cols
        ).round(4).tolist(),
        "policy": [
            [
                "GOAL"
                if env.is_terminal(row * env.cols + col)
                else ACTIONS[policy[row * env.cols + col]]
                for col in range(env.cols)
            ]
            for row in range(env.rows)
        ],
        "path": path,
        "path_length": max(0, len(path) - 1),
        "path_found": path_found,
    }
