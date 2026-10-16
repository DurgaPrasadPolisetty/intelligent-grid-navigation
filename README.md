
# Intelligent Grid Navigation

An interactive grid-navigation application that explores **Markov Decision Processes (MDPs)** and reinforcement learning through visual simulations. The project implements Value Iteration, Policy Iteration, and Q-Learning to help an agent navigate a configurable grid environment.

## Overview

The application combines a React frontend with a Python FastAPI backend. Users can configure the grid environment, define terrain and obstacles, run navigation algorithms, and explore the agent's movement and rewards.

## Features

- **Configurable grid environment:** Set the grid dimensions, starting position, and goal.
- **Multiple terrain types:** Add obstacles, water cells, and high-cost terrain.
- **MDP-based navigation:** Model states, actions, transition probabilities, and rewards.
- **Three navigation algorithms:** Value Iteration, Policy Iteration, and Q-Learning.
- **Stochastic transitions:** Configure transition noise to explore uncertain movement.
- **Interactive manual navigation:** Control the agent using direction buttons or keyboard arrow keys.
- **Reward tracking:** Inspect movement attempts, individual rewards, and cumulative episode rewards.
- **Algorithm comparison:** Compare navigation algorithm results using the application's comparison interface.
- **Sound effects:** Receive audio feedback for movement, collisions, and algorithm execution.
- **Reachability checks:** Test whether navigation paths are possible in different environments.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Algorithms | Value Iteration, Policy Iteration, Q-Learning |
| Concepts | Markov Decision Processes, Dynamic Programming, Reinforcement Learning |
| Testing | Python test scripts |

## Project Structure

```text
intelligent-grid-navigation/
├── backend/
│   ├── algorithms/
│   │   ├── policy_iteration.py
│   │   ├── q_learning.py
│   │   └── value_iteration.py
│   ├── tests/
│   ├── environment.py
│   ├── main.py
│   ├── reachability.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── LICENSE
└── README.md
```

## Getting Started

### Prerequisites

Install the following software:

- Python and pip
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/DurgaPrasadPolisetty/intelligent-grid-navigation.git
cd intelligent-grid-navigation
```

### 2. Set up the backend

Open a terminal in the project root:

```powershell
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the FastAPI server:

```powershell
python -m uvicorn main:app --reload --port 8000
```

The backend should be available at:

- API server: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

Keep this terminal running.

### 3. Set up the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite in your terminal.

Keep the frontend and backend running simultaneously. If the frontend cannot connect to the API, check the backend URL and configuration in `frontend/src/services/api.js`.

## How to Use

1. Open the application in your browser.
2. Configure the grid dimensions and terrain.
3. Select the navigation algorithm you want to explore.
4. Adjust available parameters, such as the discount factor or transition noise.
5. Run the algorithm and examine the resulting path and metrics.
6. Use the manual controls to explore movement and rewards.
7. Compare algorithm results and experiment with different environments.

## Algorithms

### Value Iteration

Uses Bellman optimality updates to estimate state values and derive an optimal policy.

### Policy Iteration

Alternates between policy evaluation and policy improvement until the policy converges.

### Q-Learning

Uses experience-based updates to learn action values and derive a navigation policy.

## Testing

Run the backend tests from the `backend` directory:

```powershell
python test_navigation_algorithms.py
python test_reachability.py
```

An additional algorithm test file is available at `backend/tests/test_algorithms.py`. Run it according to the test framework and configuration used by your project.

## Learning Objectives

This project demonstrates:

- Modeling environments as Markov Decision Processes.
- Understanding states, actions, transition probabilities, and reward functions.
- Applying dynamic programming to sequential decision-making.
- Exploring reinforcement learning through Q-Learning.
- Evaluating navigation behavior under different environment configurations.

## Future Enhancements

Potential extensions include:

- Saving and loading custom grid configurations.
- More detailed training and convergence visualizations.
- Additional reinforcement learning algorithms.
- Persistent experiment history and downloadable reports.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
