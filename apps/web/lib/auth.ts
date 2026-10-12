import "server-only";

import { prisma } from "@moozer/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";

import { meetsPasswordRules } from "./password-rules";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      // No email provider yet. Print the link locally; never log it in production.
      if (process.env.NODE_ENV === "production") {
        throw new APIError("SERVICE_UNAVAILABLE", { message: "Password reset email isn't set up yet." });
      }
      console.info(`[auth] Password reset link for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
  },
  account: {
    accountLinking: { enabled: true, trustedProviders: ["google", "github"] },
  },
  user: {
    deleteUser: { enabled: true },
  },
  hooks: {
    // Enforce the same password rules the Create account checklist shows.
    before: createAuthMiddleware(async (ctx) => {
      const password =
        ctx.path === "/sign-up/email" ? ctx.body?.password
        : ctx.path === "/reset-password" ? ctx.body?.newPassword
        : undefined;
      if (typeof password === "string" && !meetsPasswordRules(password)) {
        throw new APIError("BAD_REQUEST", {
          message: "Use 8 or more characters with upper and lower case letters, a number and a symbol.",
        });
      }
    }),
  },
  plugins: [nextCookies()], // keep last
});
