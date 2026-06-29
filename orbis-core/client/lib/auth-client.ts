import { createAuthClient } from "better-auth/react";
import { deviceAuthorizationClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: "https://orbis-ai-l2n7.onrender.com",
  plugins: [deviceAuthorizationClient()]
});