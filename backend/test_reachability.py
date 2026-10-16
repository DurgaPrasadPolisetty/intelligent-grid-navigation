
from environment import GridEnvironment
from reachability import find_grid_path


def test_reachable_goal():
    env = GridEnvironment(
        rows=5,
        cols=5,
        start=(0, 0),
        goal=(4, 4),
        obstacles=[(1, 1), (1, 3), (3, 3)],
    )

    path = find_grid_path(env)

    assert path is not None
    assert path[0] == [0, 0]
    assert path[-1] == [4, 4]


def test_goal_enclosed_by_obstacles():
    env = GridEnvironment(
        rows=5,
        cols=5,
        start=(0, 0),
        goal=(2, 2),
        obstacles=[(1, 2), (3, 2), (2, 1), (2, 3)],
    )

    assert find_grid_path(env) is None


if __name__ == "__main__":
    test_reachable_goal()
    test_goal_enclosed_by_obstacles()
    print("Both reachability tests passed.")
