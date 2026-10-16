
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator

from environment import GridEnvironment
from algorithms.value_iteration import value_iteration
from algorithms.policy_iteration import policy_iteration
from algorithms.q_learning import q_learning
from reachability import find_grid_path


app = FastAPI(
    title="Intelligent Grid Navigation API",
    description="Finite MDP, Dynamic Programming and Reinforcement Learning",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EnvironmentConfig(BaseModel):
    rows: int = Field(default=5, ge=2, le=30)
    cols: int = Field(default=5, ge=2, le=30)
    start: tuple[int, int] = (0, 0)
    goal: tuple[int, int] = (4, 4)

    obstacles: list[tuple[int, int]] = Field(
        default_factory=lambda: [(1, 1), (1, 3), (3, 3)]
    )
    high_cost_cells: list[tuple[int, int]] = Field(
        default_factory=lambda: [(2, 2)]
    )
    water_cells: list[tuple[int, int]] = Field(
        default_factory=lambda: [(2, 3)]
    )

    step_reward: float = -1.0
    goal_reward: float = 100.0
    obstacle_penalty: float = -10.0
    high_cost_penalty: float = -5.0
    water_penalty: float = -8.0
    transition_noise: float = Field(default=0.0, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_coordinates(self):
        for name in (
            "start",
            "goal",
            "obstacles",
            "high_cost_cells",
            "water_cells",
        ):
            cells = (
                [getattr(self, name)]
                if name in ("start", "goal")
                else getattr(self, name)
            )

            for row, col in cells:
                if not (
                    0 <= row < self.rows
                    and 0 <= col < self.cols
                ):
                    raise ValueError(
                        f"{name} contains an out-of-bounds coordinate."
                    )

        if self.start == self.goal:
            raise ValueError("Start and goal must be different.")

        if self.start in self.obstacles:
            raise ValueError("Start cannot be an obstacle.")

        if self.goal in self.obstacles:
            raise ValueError("Goal cannot be an obstacle.")

        if len(set(self.obstacles)) != len(self.obstacles):
            raise ValueError("Duplicate obstacle coordinates are not allowed.")

        if set(self.obstacles) & set(self.high_cost_cells):
            raise ValueError("Obstacle and high-cost cells cannot overlap.")

        if set(self.obstacles) & set(self.water_cells):
            raise ValueError("Obstacle and water cells cannot overlap.")

        if set(self.high_cost_cells) & set(self.water_cells):
            raise ValueError("Water and high-cost cells cannot overlap.")

        return self


class ValueIterationRequest(BaseModel):
    environment: EnvironmentConfig = Field(
        default_factory=EnvironmentConfig
    )
    gamma: float = Field(default=0.9, ge=0.0, lt=1.0)
    theta: float = Field(default=1e-6, gt=0.0)
    max_iterations: int = Field(default=1000, ge=1, le=100000)


class PolicyIterationRequest(ValueIterationRequest):
    pass


class QLearningRequest(BaseModel):
    environment: EnvironmentConfig = Field(
        default_factory=EnvironmentConfig
    )
    episodes: int = Field(default=2000, ge=1, le=100000)
    alpha: float = Field(default=0.1, gt=0.0, le=1.0)
    gamma: float = Field(default=0.9, ge=0.0, lt=1.0)
    epsilon: float = Field(default=1.0, ge=0.0, le=1.0)
    epsilon_decay: float = Field(default=0.995, gt=0.0, le=1.0)
    min_epsilon: float = Field(default=0.02, ge=0.0, le=1.0)
    seed: int = 42


def build_environment(config: EnvironmentConfig) -> GridEnvironment:
    try:
        return GridEnvironment(
            rows=config.rows,
            cols=config.cols,
            start=config.start,
            goal=config.goal,
            obstacles=config.obstacles,
            high_cost_cells=config.high_cost_cells,
            water_cells=config.water_cells,
            step_reward=config.step_reward,
            goal_reward=config.goal_reward,
            obstacle_penalty=config.obstacle_penalty,
            high_cost_penalty=config.high_cost_penalty,
            water_penalty=config.water_penalty,
            transition_noise=config.transition_noise,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


def ensure_goal_reachable(env: GridEnvironment) -> None:
    """Reject algorithm requests when obstacles block every route."""
    path = find_grid_path(env)

    if path is None:
        raise HTTPException(
            status_code=422,
            detail=(
                "Goal is unreachable: obstacles block every path from "
                f"start {env.start} to goal {env.goal}. "
                "Remove at least one obstacle and try again."
            ),
        )


@app.get("/")
def home():
    return {
        "project": "Intelligent Grid Navigation",
        "message": "Backend is running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/environment")
def get_environment():
    env = build_environment(EnvironmentConfig())

    return {
        "environment": env.to_dict(),
        "grid": env.to_grid(),
    }


@app.post("/api/value-iteration")
def run_value_iteration(request: ValueIterationRequest):
    env = build_environment(request.environment)
    ensure_goal_reachable(env)

    return value_iteration(
        env,
        gamma=request.gamma,
        theta=request.theta,
        max_iterations=request.max_iterations,
    )


@app.post("/api/policy-iteration")
def run_policy_iteration(request: PolicyIterationRequest):
    env = build_environment(request.environment)
    ensure_goal_reachable(env)

    return policy_iteration(
        env,
        gamma=request.gamma,
        theta=request.theta,
        max_iterations=request.max_iterations,
    )


@app.post("/api/q-learning")
def run_q_learning(request: QLearningRequest):
    env = build_environment(request.environment)
    ensure_goal_reachable(env)

    return q_learning(
        env,
        episodes=request.episodes,
        alpha=request.alpha,
        gamma=request.gamma,
        epsilon=request.epsilon,
        epsilon_decay=request.epsilon_decay,
        min_epsilon=request.min_epsilon,
        seed=request.seed,
    )
