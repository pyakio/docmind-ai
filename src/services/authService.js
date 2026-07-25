import api from "./api";

export const authService = {
  async register(full_name, email, password, phone_number = null) {
    const response = await api.post("/auth/register", {
      full_name,
      email,
      password,
      phone_number,
    });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post("/auth/login", {
      email,
      password,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data;
  },
};
