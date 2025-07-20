"use server";

import { Resend } from "resend";
import { getBaseUrl } from "./env";
import { getCurrencySymbol } from "./utils/currency";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

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

export const sendPasswordResetEmail = async (
  email: string,
  resetLink: string
) => {
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

export const sendInvoiceReceipt = async (
  email: string,
  invoiceData: {
    invoiceId: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    subscriptionPlan?: string;
    billingPeriod?: string;
    isTrialUpgrade?: boolean;
    trialEndDate?: string;
  }
) => {
  try {
    const formattedAmount = (invoiceData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(invoiceData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    // Helper function to title case interval
    const titleCaseInterval = (interval: string) => {
      return interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    };

    // Format the plan name for display
    const formattedPlan = invoiceData.subscriptionPlan
      ? titleCasePlan(invoiceData.subscriptionPlan)
      : "Unknown Plan";

    // Format the description with proper title casing
    let formattedDescription = invoiceData.description;
    if (
      invoiceData.subscriptionPlan &&
      invoiceData.description.includes(invoiceData.subscriptionPlan)
    ) {
      // Extract interval from description if present
      const intervalMatch = invoiceData.description.match(/- (\w+)$/);
      const interval = intervalMatch ? intervalMatch[1] : "";

      if (interval) {
        formattedDescription = `DineEasy ${formattedPlan} Plan - ${titleCaseInterval(interval)}`;
      } else {
        formattedDescription = `DineEasy ${formattedPlan} Plan`;
      }
    }

    // Format billing period with proper date formatting
    let formattedBillingPeriod = invoiceData.billingPeriod;
    if (
      invoiceData.billingPeriod &&
      invoiceData.billingPeriod !== "Invalid Date - Invalid Date"
    ) {
      try {
        const [startDate, endDate] = invoiceData.billingPeriod.split(" - ");
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          formattedBillingPeriod = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        } else {
          formattedBillingPeriod = "Billing period not available";
        }
      } catch (error) {
        formattedBillingPeriod = "Billing period not available";
      }
    } else {
      formattedBillingPeriod = "Billing period not available";
    }

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `Invoice Receipt - ${formattedDescription}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Invoice Receipt</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Payment Confirmation</h2>
            <p style="margin: 5px 0; color: #666;">Thank you for your payment!</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Invoice Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Invoice ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${invoiceData.invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.date}</td>
              </tr>
              ${
                invoiceData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.subscriptionPlan
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan}</td>
              </tr>
              `
                  : ""
              }
              ${
                formattedBillingPeriod !== "Billing period not available"
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Billing Period:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedBillingPeriod}</td>
              </tr>
              `
                  : ""
              }
              ${
                invoiceData.isTrialUpgrade && invoiceData.trialEndDate
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Trial Ends:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${invoiceData.trialEndDate}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Description:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedDescription}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; color: #333;">Total Amount:</td>
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px; text-align: right; color: #22c55e;">${currencySymbol}${formattedAmount}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">Payment Status</h4>
            <p style="margin: 5px 0; color: #22c55e; font-weight: bold;">✓ Payment Successful</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;">Your payment has been processed successfully.</p>
            ${
              invoiceData.isTrialUpgrade
                ? `<p style="margin: 5px 0; color: #666; font-size: 14px;">Your trial period continues until ${invoiceData.trialEndDate}.</p>`
                : ""
            }
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for choosing DineEasy!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Invoice receipt email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending invoice receipt email:", error);
    throw error;
  }
};

export const sendSubscriptionCancellationEmail = async (
  email: string,
  cancellationData: {
    subscriptionId: string;
    plan: string;
    interval: string;
    cancelDate: string;
    endDate: string;
    customerName?: string;
    restaurantName?: string;
    reason?: string;
  }
) => {
  try {
    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    // Helper function to title case interval
    const titleCaseInterval = (interval: string) => {
      return interval.charAt(0).toUpperCase() + interval.slice(1).toLowerCase();
    };

    const formattedPlan = titleCasePlan(cancellationData.plan);
    const formattedInterval = titleCaseInterval(cancellationData.interval);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Subscription Cancelled - DineEasy",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Subscription Cancellation</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin: 0 0 15px 0;">Subscription Cancelled</h2>
            <p style="margin: 5px 0; color: #856404;">Your subscription has been successfully cancelled.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Cancellation Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Subscription ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${cancellationData.subscriptionId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan} Plan - ${formattedInterval}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Cancelled On:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.cancelDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Access Until:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.endDate}</td>
              </tr>
              ${
                cancellationData.reason
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.reason}</td>
              </tr>
              `
                  : ""
              }
              ${
                cancellationData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${cancellationData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>You'll continue to have access to all features until ${cancellationData.endDate}</li>
              <li>No further charges will be made to your account</li>
              <li>You can reactivate your subscription anytime from your dashboard</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">We're sorry to see you go!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions or would like to reactivate, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Subscription cancellation email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending subscription cancellation email:", error);
    throw error;
  }
};

export const sendRefundNotificationEmail = async (
  email: string,
  refundData: {
    refundId: string;
    amount: number;
    currency: string;
    reason: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    subscriptionPlan?: string;
    isFullRefund: boolean;
  }
) => {
  try {
    const formattedAmount = (refundData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(refundData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = refundData.subscriptionPlan
      ? titleCasePlan(refundData.subscriptionPlan)
      : "Unknown Plan";

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `Refund Processed - ${refundData.isFullRefund ? "Full" : "Partial"} Refund`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Refund Notification</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">Refund Processed</h2>
            <p style="margin: 5px 0; color: #155724;">Your refund has been successfully processed.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Refund Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Refund ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${refundData.refundId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Refund Type:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${refundData.isFullRefund ? "Full Refund" : "Partial Refund"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Refunded:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #28a745;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Currency:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.currency}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.reason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.date}</td>
              </tr>
              ${
                refundData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                refundData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${refundData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
              ${
                refundData.subscriptionPlan
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Subscription Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>The refund will be processed to your original payment method</li>
              <li>It may take 5-10 business days to appear on your statement</li>
              ${refundData.isFullRefund ? "<li>Your subscription has been cancelled</li>" : "<li>Your subscription remains active</li>"}
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Thank you for your understanding!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              If you have any questions about this refund, please contact our support team.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Refund notification email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending refund notification email:", error);
    throw error;
  }
};

export const sendPaymentFailedEmail = async (
  email: string,
  paymentData: {
    invoiceId: string;
    amount: number;
    currency: string;
    subscriptionPlan: string;
    interval: string;
    dueDate: string;
    customerName?: string;
    restaurantName?: string;
    retryDate?: string;
  }
) => {
  try {
    const formattedAmount = (paymentData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(paymentData.currency);

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = titleCasePlan(paymentData.subscriptionPlan);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Payment Failed - Action Required",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Payment Notification</p>
          </div>
          
          <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
            <h2 style="color: #721c24; margin: 0 0 15px 0;">Payment Failed</h2>
            <p style="margin: 5px 0; color: #721c24;">We were unable to process your subscription payment.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Payment Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Invoice ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${paymentData.invoiceId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Due:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #dc3545;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${formattedPlan} Plan - ${paymentData.interval}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Due Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.dueDate}</td>
              </tr>
              ${
                paymentData.retryDate
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Next Retry:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.retryDate}</td>
              </tr>
              `
                  : ""
              }
              ${
                paymentData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                paymentData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${paymentData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">What you need to do:</h4>
            <ul style="margin: 5px 0; color: #856404; font-size: 14px; padding-left: 20px;">
              <li>Update your payment method in your billing settings</li>
              <li>Ensure your card has sufficient funds</li>
              <li>Check that your card hasn't expired</li>
              <li>Contact your bank if there are any restrictions</li>
            </ul>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens if payment continues to fail?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>Your subscription will be suspended after multiple failed attempts</li>
              <li>You'll lose access to premium features</li>
              <li>Your restaurant data will be preserved</li>
              <li>You can reactivate anytime by updating your payment method</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Need help? Contact our support team!</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              We're here to help you resolve any payment issues quickly.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Payment failed email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending payment failed email:", error);
    throw error;
  }
};

export const sendPaymentDisputeEmail = async (
  email: string,
  disputeData: {
    disputeId: string;
    amount: number;
    currency: string;
    reason: string;
    date: string;
    customerName?: string;
    restaurantName?: string;
    orderId?: string;
  }
) => {
  try {
    const formattedAmount = (disputeData.amount / 100).toFixed(2);
    const currencySymbol = getCurrencySymbol(disputeData.currency);

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "Payment Dispute Received",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Payment Dispute Notification</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h2 style="color: #856404; margin: 0 0 15px 0;">Payment Dispute Received</h2>
            <p style="margin: 5px 0; color: #856404;">A customer has disputed a payment for your restaurant.</p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Dispute Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Dispute ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${disputeData.disputeId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Amount Disputed:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: #ffc107;">${currencySymbol}${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Reason:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.reason}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.date}</td>
              </tr>
              ${
                disputeData.orderId
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Order ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.orderId}</td>
              </tr>
              `
                  : ""
              }
              ${
                disputeData.customerName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Customer:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.customerName}</td>
              </tr>
              `
                  : ""
              }
              ${
                disputeData.restaurantName
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${disputeData.restaurantName}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">What happens next?</h4>
            <ul style="margin: 5px 0; color: #666; font-size: 14px; padding-left: 20px;">
              <li>We'll review the dispute and gather evidence</li>
              <li>You may be asked to provide additional documentation</li>
              <li>The dispute will be resolved within 30-60 days</li>
              <li>You'll be notified of the final decision</li>
            </ul>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
            <h4 style="color: #004085; margin: 0 0 10px 0;">How to respond:</h4>
            <ul style="margin: 5px 0; color: #004085; font-size: 14px; padding-left: 20px;">
              <li>Review the order details and customer communication</li>
              <li>Gather any relevant documentation (receipts, delivery confirmations)</li>
              <li>Contact our support team if you need assistance</li>
              <li>Respond promptly to any requests for information</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Need help with this dispute?</p>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              Contact our support team for assistance with dispute resolution.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw error;
    }

    console.log("Payment dispute email sent successfully:", data);
    return { success: true };
  } catch (error) {
    console.error("Error sending payment dispute email:", error);
    throw error;
  }
};

export const sendWelcomeToDineEasyEmail = async (
  email: string,
  welcomeData: {
    restaurantName: string;
    customerName?: string;
    plan?: string;
    interval?: string;
    trialEndDate?: string;
    hasStripeConnect: boolean;
    stripeConnectEnabled?: boolean;
    features: string[];
    nextSteps: string[];
    // New Stripe Connect specific data
    stripeAccountId?: string;
    stripeCountry?: string;
    stripeBusinessType?: string;
    stripeChargesEnabled?: boolean;
    stripePayoutsEnabled?: boolean;
    stripeSetupDate?: string;
  }
) => {
  try {
    console.log("📧 sendWelcomeToDineEasyEmail called with:", {
      email,
      welcomeData,
    });

    // Check if Resend API key is available
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is not set");
      console.error("🔍 Environment check:", {
        NODE_ENV: process.env.NODE_ENV,
        hasResendKey: !!process.env.RESEND_API_KEY,
        resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      });
      throw new Error(
        "Email service not configured - RESEND_API_KEY is missing"
      );
    }

    console.log("✅ RESEND_API_KEY is available");
    console.log(
      "🔍 Resend key starts with:",
      process.env.RESEND_API_KEY.substring(0, 10) + "..."
    );

    // Validate email
    if (!email || !email.includes("@")) {
      console.error("❌ Invalid email address:", email);
      throw new Error("Invalid email address provided");
    }

    // Helper function to title case plan names
    const titleCasePlan = (plan: string) => {
      return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
    };

    const formattedPlan = welcomeData.plan
      ? titleCasePlan(welcomeData.plan)
      : "Starter";
    const greeting =
      welcomeData.customerName || welcomeData.restaurantName || "there";

    // Determine if Stripe Connect is fully set up
    const isStripeConnectComplete =
      welcomeData.hasStripeConnect &&
      welcomeData.stripeConnectEnabled &&
      welcomeData.stripeAccountId;

    console.log("📧 Preparing email with:", {
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `🎉 Welcome to DineEasy, ${welcomeData.restaurantName}!`,
      formattedPlan,
      greeting,
      isStripeConnectComplete,
    });

    // Create the email HTML content
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">🍽️ DineEasy</h1>
            <p style="color: #666; margin: 5px 0;">Welcome to Your Restaurant Management Platform!</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h2 style="color: #155724; margin: 0 0 15px 0;">🎉 Welcome to DineEasy!</h2>
            <p style="margin: 5px 0; color: #155724; font-size: 16px; line-height: 1.6;">
              Hi ${greeting},<br>
              Congratulations on setting up your restaurant with DineEasy! You're now ready to streamline your operations and enhance your customer experience.
            </p>
          </div>
          
          <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Your Restaurant Setup</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Restaurant:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${welcomeData.restaurantName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Plan:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${formattedPlan} Plan</td>
              </tr>
              ${
                welcomeData.interval
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Billing:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${welcomeData.interval.charAt(0).toUpperCase() + welcomeData.interval.slice(1)}</td>
              </tr>
              `
                  : ""
              }
              ${
                welcomeData.trialEndDate
                  ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Trial Ends:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold;">${welcomeData.trialEndDate}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #666;">Payment Processing:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: bold; color: ${isStripeConnectComplete ? "#28a745" : "#dc3545"};">
                  ${isStripeConnectComplete ? "✅ Ready" : "❌ Not Set Up"}
                </td>
              </tr>
            </table>
          </div>
          
          ${
            isStripeConnectComplete
              ? `
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #17a2b8;">
            <h3 style="color: #0c5460; margin: 0 0 15px 0;">💳 Payment Processing Setup Complete!</h3>
            <p style="margin: 5px 0; color: #0c5460; font-size: 16px; line-height: 1.6;">
              Your Stripe Connect account has been successfully set up and is ready to accept payments from your customers!
            </p>
            
            <div style="background-color: white; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin-top: 15px;">
              <h4 style="color: #0c5460; margin: 0 0 10px 0;">Account Details</h4>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #666;">Account ID:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; font-family: monospace;">${welcomeData.stripeAccountId}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;">Country:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold;">${welcomeData.stripeCountry}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;">Business Type:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold;">${welcomeData.stripeBusinessType}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;">Accepting Payments:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: ${welcomeData.stripeChargesEnabled ? "#28a745" : "#dc3545"};">
                    ${welcomeData.stripeChargesEnabled ? "✅ Enabled" : "❌ Disabled"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;">Payouts:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold; color: ${welcomeData.stripePayoutsEnabled ? "#28a745" : "#ffc107"};">
                    ${welcomeData.stripePayoutsEnabled ? "✅ Enabled" : "⏳ Pending"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #666;">Setup Date:</td>
                  <td style="padding: 4px 0; text-align: right; font-weight: bold;">${welcomeData.stripeSetupDate}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">Important Notes</h4>
              <ul style="color: #856404; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0;">
                <li style="margin-bottom: 5px;">Payouts may take 2-7 business days to reach your bank account</li>
                <li style="margin-bottom: 5px;">Stripe fees will be automatically deducted from each transaction</li>
                <li style="margin-bottom: 5px;">Keep your business information up to date in your Stripe dashboard</li>
              </ul>
            </div>
          </div>
          `
              : ""
          }
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #333; margin: 0 0 15px 0;">Your ${formattedPlan} Plan Features</h3>
            <ul style="color: #666; line-height: 1.6; padding-left: 20px; margin: 0;">
              ${welcomeData.features.map((feature) => `<li style="margin-bottom: 8px;">${feature}</li>`).join("")}
            </ul>
          </div>
          
          <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #007bff;">
            <h3 style="color: #004085; margin: 0 0 15px 0;">🚀 What's Next?</h3>
            <ol style="color: #004085; line-height: 1.6; padding-left: 20px; margin: 0;">
              ${welcomeData.nextSteps.map((step) => `<li style="margin-bottom: 8px;">${step}</li>`).join("")}
            </ol>
          </div>
          
          ${
            !isStripeConnectComplete
              ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">💳 Complete Your Payment Setup</h4>
            <p style="color: #856404; margin: 5px 0; font-size: 14px; line-height: 1.6;">
              To start accepting payments from customers, you'll need to complete your Stripe Connect setup. 
              This allows customers to pay you directly through QR codes and orders.
            </p>
            <p style="color: #856404; margin: 5px 0; font-size: 14px; line-height: 1.6;">
              <strong>Next:</strong> Go to your dashboard and click "Connect Stripe" to set up payment processing.
            </p>
          </div>
          `
              : ""
          }
          
          <div style="background-color: #f1f3f4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="color: #333; margin: 0 0 10px 0;">💡 Pro Tips</h4>
            <ul style="color: #666; font-size: 14px; line-height: 1.6; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 5px;">Set up your menu items with clear descriptions and photos</li>
              <li style="margin-bottom: 5px;">Configure your business hours and service types</li>
              <li style="margin-bottom: 5px;">Test your QR code ordering system before going live</li>
              <li style="margin-bottom: 5px;">Review your analytics regularly to optimize operations</li>
              ${isStripeConnectComplete ? '<li style="margin-bottom: 5px;">Monitor your payment dashboard for transaction insights</li>' : ""}
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; margin: 5px 0; font-size: 14px;">Ready to get started?</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="
              display: inline-block;
              padding: 12px 24px;
              background-color: #22c55e;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 16px 0;
              font-weight: bold;
            ">
              Go to Dashboard
            </a>
            <p style="color: #666; margin: 5px 0; font-size: 12px;">
              Need help? Contact our support team at <a href="mailto:support@dineeasy.ch" style="color: #22c55e;">support@dineeasy.ch</a>
            </p>
          </div>
        </div>
      `;

    console.log("📧 Sending email via Resend...");
    console.log("📧 Email details:", {
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `🎉 Welcome to DineEasy, ${welcomeData.restaurantName}!`,
      htmlLength: emailHtml.length,
    });

    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: `🎉 Welcome to DineEasy, ${welcomeData.restaurantName}!`,
      html: emailHtml,
    });

    if (error) {
      console.error("❌ Resend API error:", error);
      console.error("🔍 Error details:", {
        name: error.name,
        message: error.message,
      });
      throw error;
    }

    console.log("✅ Welcome to DineEasy email sent successfully:", data);
    console.log("📧 Email ID:", data?.id);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("❌ Error sending welcome to DineEasy email:", error);
    console.error("🔍 Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
      cause: (error as Error)?.cause,
    });

    // Log additional debugging information
    console.error("🔍 Debug info:", {
      email,
      restaurantName: welcomeData.restaurantName,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    });

    throw error;
  }
};

// Test function to debug email sending
export const testEmailSending = async (email: string) => {
  try {
    console.log("🧪 Testing email sending to:", email);

    // Check environment
    console.log("🔍 Environment check:", {
      NODE_ENV: process.env.NODE_ENV,
      hasResendKey: !!process.env.RESEND_API_KEY,
      resendKeyLength: process.env.RESEND_API_KEY?.length || 0,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Test simple email
    const { data, error } = await resend.emails.send({
      from: "DineEasy <noreply@dineeasy.ch>",
      to: email,
      subject: "🧪 DineEasy Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #22c55e;">🍽️ DineEasy Email Test</h1>
          <p>This is a test email to verify that the email system is working correctly.</p>
          <p>If you receive this email, the email configuration is working properly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Test email failed:", error);
      throw error;
    }

    console.log("✅ Test email sent successfully:", data);
    return { success: true, emailId: data?.id };
  } catch (error) {
    console.error("❌ Test email error:", error);
    throw error;
  }
};
