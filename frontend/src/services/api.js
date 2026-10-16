
const API_BASE = "http://127.0.0.1:8000";

async function request(path, body) {
  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Cannot connect to FastAPI. Make sure the backend is running on port 8000."
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item) =>
                `${item.loc?.join(".") ?? "Request"}: ${item.msg}`
              )
              .join("; ")
          : `API request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

export function runAlgorithm(algorithm, config) {
  const endpoints = {
    "Value Iteration": "/api/value-iteration",
    "Policy Iteration": "/api/policy-iteration",
    "Q-Learning": "/api/q-learning",
  };

  const endpoint = endpoints[algorithm];

  if (!endpoint) {
    throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  const common = {
    environment: {
      ...config.environment,
      transition_noise: Number(config.environment.transition_noise ?? 0),
    },
    gamma: Number(config.gamma),
  };

  let body;

  if (algorithm === "Q-Learning") {
    body = {
      ...common,
      episodes: Number(config.episodes ?? 2000),
      alpha: Number(config.alpha ?? 0.1),
      epsilon: Number(config.epsilon ?? 1),
      epsilon_decay: Number(config.epsilon_decay ?? 0.995),
      min_epsilon: Number(config.min_epsilon ?? 0.02),
      seed: 42,
    };
  } else {
    body = {
      ...common,
      theta: Number(config.theta ?? 0.000001),
      max_iterations: Number(config.max_iterations ?? 1000),
    };
  }

  return request(endpoint, body);
}
