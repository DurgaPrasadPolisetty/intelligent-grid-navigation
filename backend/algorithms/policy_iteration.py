
import time

import numpy as np

from environment import ACTIONS
from algorithms.value_iteration import extract_path


def policy_iteration(
    env,
    gamma=0.9,
    theta=1e-6,
    max_iterations=1000,
    max_evaluation_iterations=10000,
):
    """Find an optimal policy using policy evaluation and improvement."""
    if not 0 <= gamma < 1:
        raise ValueError("gamma must be in [0, 1).")

    if theta <= 0:
        raise ValueError("theta must be positive.")

    if max_iterations < 1:
        raise ValueError("max_iterations must be positive.")

    if max_evaluation_iterations < 1:
        raise ValueError(
            "max_evaluation_iterations must be positive."
        )

    started = time.perf_counter()

    values = np.zeros(env.n_states, dtype=float)
    policy = np.zeros(env.n_states, dtype=int)

    converged = False
    evaluation_converged = False
    stable = False
    evaluation_iterations = 0
    iteration = 0

    for iteration in range(1, max_iterations + 1):
        # 1. Policy evaluation.
        evaluation_converged = False

        for evaluation_iterations in range(
            1, max_evaluation_iterations + 1
        ):
            delta = 0.0

            for state in range(env.n_states):
                if env.is_terminal(state):
                    values[state] = 0.0
                    continue

                action = ACTIONS[policy[state]]

                new_value = sum(
                    probability * (
                        reward + gamma * values[next_state]
                    )
                    for probability, next_state, reward
                    in env.transition_outcomes(state, action)
                )

                delta = max(
                    delta,
                    abs(new_value - values[state]),
                )
                values[state] = new_value

            if delta < theta:
                evaluation_converged = True
                break

        # 2. Policy improvement.
        stable = True

        for state in range(env.n_states):
            if env.is_terminal(state):
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

            best_action = int(np.argmax(action_values))

            if best_action != policy[state]:
                policy[state] = best_action
                stable = False

        # Full convergence requires both accurate evaluation and
        # a stable policy.
        if stable and evaluation_converged:
            converged = True
            break

    path = extract_path(env, policy)
    path_found = (
        len(path) > 0
        and tuple(path[0]) == tuple(env.start)
        and tuple(path[-1]) == tuple(env.goal)
    )

    elapsed_ms = (time.perf_counter() - started) * 1000

    return {
        "algorithm": "Policy Iteration",
        "converged": converged,
        "policy_stable": stable,
        "evaluation_converged": evaluation_converged,
        "iterations": iteration,
        "evaluation_iterations": evaluation_iterations,
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
