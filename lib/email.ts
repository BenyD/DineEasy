"use server";

import { Resend } from "resend";
import { getBaseUrl } from "./env";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;

  try {
    console.log("Attempting to send verification email to:", email);
    console.log("Using verification link:", verificationLink);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Verify your DineEasy account",
      html: `
        <h2>Welcome to DineEasy!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p>
          <a href="${verificationLink}" style="
            padding: 12px 24px;
            background-color: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 16px 0;
          ">
            Verify Email Address
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error; // Re-throw to handle in the calling function
  }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Reset your DineEasy password",
      html: `
        <h2>Reset Your Password</h2>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p>
          <a href="${resetLink}" style="
            padding: 12px 24px;
            background-color: #22c55e;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
            margin: 16px 0;
          ">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p>${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      `,
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error; // Re-throw to handle in the calling function
  }
};
