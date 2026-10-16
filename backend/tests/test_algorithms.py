
import unittest

from environment import GridEnvironment
from algorithms.value_iteration import value_iteration
from algorithms.policy_iteration import policy_iteration
from algorithms.q_learning import q_learning


class TestGridNavigation(unittest.TestCase):
    def setUp(self):
        self.env = GridEnvironment(
            rows=5,
            cols=5,
            start=(0, 0),
            goal=(4, 4),
            obstacles=[(1, 1), (1, 3), (3, 3)],
            high_cost_cells=[(2, 2)],
            water_cells=[(2, 3)],
            transition_noise=0.0,
        )

    def test_state_conversion(self):
        self.assertEqual(self.env.to_state((1, 2)), 7)
        self.assertEqual(self.env.to_position(7), (1, 2))

    def test_transition_probabilities_sum_to_one(self):
        for action in ("UP", "DOWN", "LEFT", "RIGHT"):
            outcomes = self.env.transition_outcomes(
                self.env.start_state, action
            )
            self.assertAlmostEqual(
                sum(item[0] for item in outcomes), 1.0
            )

    def test_stochastic_transitions(self):
        env = GridEnvironment(5, 5, transition_noise=0.3)
        outcomes = env.transition_outcomes(env.start_state, "RIGHT")
        self.assertAlmostEqual(sum(item[0] for item in outcomes), 1.0)
        self.assertGreater(len(outcomes), 1)

    def test_value_iteration(self):
        result = value_iteration(self.env)
        self.assertTrue(result["converged"])
        self.assertEqual(len(result["values"]), 5)
        self.assertEqual(result["policy"][4][4], "GOAL")
        self.assertEqual(result["path"][0], [0, 0])
        self.assertEqual(result["path"][-1], [4, 4])

    def test_policy_iteration(self):
        result = policy_iteration(self.env)
        self.assertTrue(result["converged"])
        self.assertEqual(result["policy"][4][4], "GOAL")
        self.assertEqual(result["path"][0], [0, 0])
        self.assertEqual(result["path"][-1], [4, 4])

    def test_q_learning(self):
        result = q_learning(self.env, episodes=3000, seed=42)
        self.assertEqual(len(result["q_table"]), 25)
        self.assertEqual(len(result["learning_curve"]) > 0, True)
        self.assertEqual(result["path"][0], [0, 0])
        self.assertEqual(result["path"][-1], [4, 4])


if __name__ == "__main__":
    unittest.main(verbosity=2)
