# Footer

                    <Text style={styles.footer}>
                        If you did not request this email, you can safely ignore it. <br />

                    </Text>
                    <br />

                    <Text style={{ ...styles.pCentered, fontSize: 12, lineHeight: "15px" }}>
                        Humaify UG (haftungsbeschränkt) <br />
                        Kolonie 9 <br />
                        14798 Havelsee <br />
                    </Text>
                    <Text style={{ textAlign: "center", paddingBottom: 8, paddingTop: 4 }}>
                        <Link href="https://humaify.de" style={{ ...styles.link, color: "#9ca3af" }}>Website</Link>
                        <span style={styles.verticalLine} />
                        <Link href="https://humaify.de/contact" style={{ ...styles.link, color: "#9ca3af" }}>Contact</Link>
                        <span style={styles.verticalLine} />
                        <Link href="https://humaify.de/legal/privacy-policy" style={{ ...styles.link, color: "#9ca3af" }}>Privacy Policy</Link>
                        <span style={styles.verticalLine} />
                        <Link href="https://humaify.de/legal/terms-of-use" style={{ ...styles.link, color: "#9ca3af" }}>Terms of Service</Link>
                    </Text>

                    <Text style={{ ...styles.pCentered, fontSize: 12, textAlign: "center", lineHeight: "15px" }}>
                        Managing Director Tim Siebert<br />
                        <br />
                        Commercial Register: Potsdam Local Court<br />
                        Commercial Register No.: HRB 41442<br />
                        VAT ID No.: DE 357 635 758<br />
                        <br />
                        © {new Date().getFullYear()} Humaify UG (haftungsbeschränkt). All rights reserved.
                    </Text>



    footer: {
        margin: 0,
        fontSize: 12,
        color: "#9ca3af",
    },
    footerLink: {
        color: "#2563eb",
        textDecoration: "none",
    },                   



# Design

import * as React from "react";

/**
 * Base email styles shared across all transactional email templates.
 * Individual email templates can extend these styles with their own custom styles.
 */
export const baseEmailStyles: Record<string, React.CSSProperties> = {
    // Text alignment styles (for <p>, <span>, <h1-h6>, etc.)
    smallWidth: {
        maxWidth: 220,
    },
    mediumWidth: {
        maxWidth: 280,
    },
    largeWidth: {
        maxWidth: 340,
    },
    textCentered: {
        textAlign: "center",
        display: "block",
        margin: 0,
        WebkitTextSizeAdjust: "100%",
    },
    // ... more styles ...
    body: {
        margin: 0,
        padding: 0,
        backgroundColor: "#ffffff",
        fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    },
    container: {
        maxWidth: 420,
        margin: "0 auto",
        padding: "32px 28px",
        lineHeight: 1.6,
        backgroundColor: "#ffffff",
        borderRadius: 14,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
    },
    // ... more styles ...
};


# Content Design

import { render } from "@react-email/render";
import * as React from "react";

import MagicLinkEmail from "../emails/magic-link-email";
import EmailVerificationEmail from "../emails/email-verification-email";
import AccountInSetupEmail from "../emails/account-in-setup-email";
import RecurringPaymentPlanEmail from "../emails/recurring-payment-plan-email";
import OneTimePaymentRequestEmail from "../emails/one-time-payment-request-email";

export async function buildMagicLinkEmail(params: {
    url: string;
}): Promise<{ subject: string; html: string; text: string }> {
    const subject = "Your sign-in link";

    const text = `Use this link to sign in:\n\n${params.url}\n\nThis link expires shortly. If you did not request this email, you can ignore it.`;

    const html = await render(
        React.createElement(MagicLinkEmail, { url: params.url }),
        {
            pretty: true,
        }
    );

    return { subject, html, text };
}

export async function buildEmailVerificationEmail(params: {
    url: string;
    name?: string | null;
}): Promise<{ subject: string; html: string; text: string }> {
    const subject = "Confirm your email address";
    const greetingName = params.name?.trim();

    const text = [
        greetingName ? `Hi ${greetingName},` : "Hi there,",
        "",
        "Thanks for creating your Humaify manager account.",
        "",
        "Please confirm your email address by clicking the link below:",
        params.url,
        "",
        "This link expires in 24 hours. If you did not create this account, you can ignore this email.",
    ].join("\n");

    const html = await render(
        React.createElement(EmailVerificationEmail, {
            url: params.url,
            name: params.name,
        }),
        {
            pretty: true,
        }
    );

    return { subject, html, text };
}

export async function buildAccountInSetupEmail(params: {
    name?: string | null;
    dashboardUrl?: string;
}): Promise<{ subject: string; html: string; text: string }> {
    const subject = "Welcome to Humaify! 🎉";
    const greetingName = params.name?.trim();
    const dashboardUrl = params.dashboardUrl || "https://app.humaify.de/customer";

    const text = [
        greetingName ? `Hi ${greetingName},` : "Hi there,",
        "",
        "Your account setup is complete! You're all set to start building intelligent voice agents with Humaify.",
        "",
        "Here's what you can do next:",
        "• Configure your first AI agent",
        "• Set up your phone numbers",
        "• Explore agent tools and handoffs",
        "• Review your account settings",
        "",
        `Go to your dashboard: ${dashboardUrl}`,
        "",
        "Need help getting started? Check out our documentation at https://app.humaify.de/docs or reach out to our support team.",
    ].join("\n");

    const html = await render(
        React.createElement(AccountInSetupEmail, {
            name: params.name,
            dashboardUrl: params.dashboardUrl,
        }),
        {
            pretty: true,
        }
    );

    return { subject, html, text };
}

export async function buildRecurringPaymentPlanEmail(params: {
    name?: string | null;
    paymentUrl: string;
    planName: string;
    baseAmount: string;
    perMinuteAmount: string;
    currency?: string;
    billingInterval: string;
    startDate?: string;
}): Promise<{ subject: string; html: string; text: string }> {
    const subject = "Your Payment Plan is Ready";
    const greetingName = params.name?.trim();
    const currency = params.currency?.toUpperCase() || "EUR";
    const baseAmount = params.baseAmount || "0.00";
    const perMinuteAmount = params.perMinuteAmount || "0.00";
    const billingInterval = params.billingInterval || "month";

    const text = [
        greetingName ? `Hi ${greetingName},` : "Hi there,",
        "",
        "Your recurring payment plan has been set up. Here are the details:",
        "",
        `Plan: ${params.planName}`,
        `Base Fee: ${currency} ${baseAmount} per ${billingInterval}`,
        `Usage Rate: ${currency} ${perMinuteAmount} per minute`,
        params.startDate ? `Start Date: ${params.startDate}` : "",
        "",
        "Complete your payment setup:",
        params.paymentUrl,
        "",
        "This link is secure and expires in 7 days. You can manage your subscription anytime from your account dashboard.",
    ]
        .filter(Boolean)
        .join("\n");

    const html = await render(
        React.createElement(RecurringPaymentPlanEmail, {
            name: params.name,
            paymentUrl: params.paymentUrl,
            planName: params.planName,
            baseAmount,
            perMinuteAmount,
            currency,
            billingInterval,
            startDate: params.startDate,
        }),
        {
            pretty: true,
        }
    );

    return { subject, html, text };
}

export async function buildOneTimePaymentRequestEmail(params: {
    name?: string | null;
    paymentUrl: string;
    amount: string;
    currency?: string;
    reason?: string;
    description?: string;
    dueDate?: string;
    invoiceNumber?: string;
}): Promise<{ subject: string; html: string; text: string }> {
    const subject = "Payment Request";
    const greetingName = params.name?.trim();
    const currency = params.currency || "EUR";

    const text = [
        greetingName ? `Hi ${greetingName},` : "Hi there,",
        "",
        "You have a payment request from Humaify. Please review the details below:",
        "",
        `Amount Due: ${currency} ${params.amount}`,
        params.invoiceNumber ? `Invoice #: ${params.invoiceNumber}` : "",
        params.reason ? `Reason: ${params.reason}` : "",
        params.description ? `Description: ${params.description}` : "",
        params.dueDate ? `Due Date: ${params.dueDate}` : "",
        "",
        "Pay now:",
        params.paymentUrl,
        "",
        "This is a secure payment link. If you have any questions about this payment, please contact our support team.",
    ]
        .filter(Boolean)
        .join("\n");

    const html = await render(
        React.createElement(OneTimePaymentRequestEmail, {
            name: params.name,
            paymentUrl: params.paymentUrl,
            amount: params.amount,
            currency: params.currency,
            reason: params.reason,
            description: params.description,
            dueDate: params.dueDate,
            invoiceNumber: params.invoiceNumber,
        }),
        {
            pretty: true,
        }
    );

    return { subject, html, text };
}

export {
    MagicLinkEmail,
    EmailVerificationEmail,
    AccountInSetupEmail,
    RecurringPaymentPlanEmail,
    OneTimePaymentRequestEmail,
};
