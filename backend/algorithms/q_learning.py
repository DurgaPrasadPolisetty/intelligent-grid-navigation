
import random
import time

import numpy as np

from environment import ACTIONS
from algorithms.value_iteration import extract_path


def q_learning(
    env,
    episodes=2000,
    alpha=0.1,
    gamma=0.9,
    epsilon=1.0,
    epsilon_decay=0.995,
    min_epsilon=0.02,
    max_steps_per_episode=None,
    seed=42,
):
    """Learn a navigation policy using tabular Q-Learning."""
    if episodes < 1:
        raise ValueError("episodes must be positive.")

    if not 0 < alpha <= 1:
        raise ValueError("alpha must be in (0, 1].")

    if not 0 <= gamma < 1:
        raise ValueError("gamma must be in [0, 1).")

    if not 0 <= epsilon <= 1:
        raise ValueError("epsilon must be in [0, 1].")

    if not 0 < epsilon_decay <= 1:
        raise ValueError("epsilon_decay must be in (0, 1].")

    if not 0 <= min_epsilon <= 1:
        raise ValueError("min_epsilon must be in [0, 1].")

    if max_steps_per_episode is not None:
        if max_steps_per_episode < 1:
            raise ValueError(
                "max_steps_per_episode must be positive."
            )

    random.seed(seed)
    rng = np.random.default_rng(seed)

    started = time.perf_counter()

    q_table = np.zeros(
        (env.n_states, env.n_actions),
        dtype=float,
    )

    rewards_per_episode = []
    steps_per_episode = []
    successes_per_episode = []

    max_steps = (
        env.n_states * 4
        if max_steps_per_episode is None
        else max_steps_per_episode
    )

    current_epsilon = epsilon

    for _ in range(episodes):
        state = env.start_state
        total_reward = 0.0
        reached_goal = False
        steps_taken = 0

        for step in range(1, max_steps + 1):
            steps_taken = step

            # Epsilon-greedy action selection.
            if random.random() < current_epsilon:
                action_index = random.randrange(env.n_actions)
            else:
                action_index = int(np.argmax(q_table[state]))

            action = ACTIONS[action_index]

            # Sample a transition from the environment's model.
            outcomes = env.transition_outcomes(state, action)

            probabilities = np.asarray(
                [outcome[0] for outcome in outcomes],
                dtype=float,
            )

            # Protect against small floating-point rounding errors.
            probabilities /= probabilities.sum()

            chosen_index = int(
                rng.choice(len(outcomes), p=probabilities)
            )

            _, next_state, reward = outcomes[chosen_index]

            # No future reward is accumulated after entering a
            # terminal state.
            future_value = (
                0.0
                if env.is_terminal(next_state)
                else float(np.max(q_table[next_state]))
            )

            target = reward + gamma * future_value

            q_table[state, action_index] += alpha * (
                target - q_table[state, action_index]
            )

            total_reward += reward
            state = next_state

            if env.is_terminal(state):
                reached_goal = True
                break

        rewards_per_episode.append(float(total_reward))
        steps_per_episode.append(steps_taken)
        successes_per_episode.append(reached_goal)

        current_epsilon = max(
            min_epsilon,
            current_epsilon * epsilon_decay,
        )

    # Build the greedy policy from the learned Q-table.
    policy = np.argmax(q_table, axis=1)

    path = extract_path(env, policy)

    path_found = (
        len(path) > 0
        and tuple(path[0]) == tuple(env.start)
        and tuple(path[-1]) == tuple(env.goal)
    )

    # Group episode rewards into at most approximately 100 points.
    window = max(1, int(np.ceil(episodes / 100)))
    learning_curve = []

    for start in range(0, episodes, window):
        batch = rewards_per_episode[start:start + window]

        learning_curve.append({
            "episode": start + 1,
            "average_reward": round(
                float(np.mean(batch)), 4
            ),
        })

    # Moving success rate helps visualize learning progress.
    success_curve = []

    for start in range(0, episodes, window):
        batch = successes_per_episode[start:start + window]

        success_curve.append({
            "episode": start + 1,
            "success_rate": round(
                float(np.mean(batch)), 4
            ),
        })

    recent_count = min(100, episodes)
    recent_success_rate = float(
        np.mean(successes_per_episode[-recent_count:])
    )

    elapsed_ms = (time.perf_counter() - started) * 1000

    return {
        "algorithm": "Q-Learning",
        "episodes": episodes,
        "runtime_ms": round(elapsed_ms, 3),
        "q_table": q_table.round(4).tolist(),
        "values": np.max(q_table, axis=1).reshape(
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
        "rewards_per_episode": rewards_per_episode,
        "steps_per_episode": steps_per_episode,
        "successes_per_episode": successes_per_episode,
        "success_rate": round(
            float(np.mean(successes_per_episode)), 4
        ),
        "recent_success_rate": round(
            recent_success_rate, 4
        ),
        "learning_curve": learning_curve,
        "success_curve": success_curve,
        "final_epsilon": round(current_epsilon, 5),
    }
