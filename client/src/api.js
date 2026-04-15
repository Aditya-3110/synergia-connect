export const API_URL = "http://localhost:8000";

export function getAuthConfig(tokenOverride) {
  const token = tokenOverride || localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
