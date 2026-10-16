
from environment import GridEnvironment
from algorithms.value_iteration import value_iteration
from algorithms.policy_iteration import policy_iteration
from algorithms.q_learning import q_learning
from reachability import find_grid_path


def check_path(name, result, env):
    path = result.get("path", [])
    reached_goal = bool(path) and path[-1] == list(env.goal)

    print(f"\n{name}")
    print("Converged:", result.get("converged", "N/A"))
    print("Iterations / episodes:",
          result.get("iterations", result.get("episodes")))
    print("Path:", path)
    print("Goal reached:", reached_goal)

    if not reached_goal:
        print("WARNING: algorithm did not produce a goal-reaching path.")

    return reached_goal


# A known reachable environment.
env = GridEnvironment(
    rows=5,
    cols=5,
    start=(0, 0),
    goal=(4, 4),
    obstacles=[(1, 1), (1, 3), (3, 3)],
    high_cost_cells=[(2, 2)],
    water_cells=[(2, 3)],
    transition_noise=0,
)

assert find_grid_path(env) is not None

results = [
    ("Value Iteration", value_iteration(env)),
    ("Policy Iteration", policy_iteration(env)),
    ("Q-Learning", q_learning(env, episodes=3000, seed=42)),
]

for name, result in results:
    check_path(name, result, env)
