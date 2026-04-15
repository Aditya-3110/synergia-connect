export const API_URL = "https://synergia-connect-zgdm.onrender.com";

export function getAuthConfig(tokenOverride) {
  const token = tokenOverride || localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}
