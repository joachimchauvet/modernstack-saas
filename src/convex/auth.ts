import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import { type DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import authSchema from './betterAuth/schema';

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: {
		schema: authSchema
	}
});

export const createAuth = (
	ctx: GenericCtx<DataModel>,
	{ optionsOnly } = { optionsOnly: false }
) => {
	return betterAuth({
		// disable logging when createAuth is called just to generate options.
		// this is not required, but there's a lot of noise in logs without it.
		logger: {
			disabled: optionsOnly
		},
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		// User configuration
		user: {
			changeEmail: {
				enabled: true,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				sendChangeEmailVerification: async ({ user, newEmail, url, token }, _request) => {
					const resendApiKey = process.env.RESEND_API_KEY;
					const from = process.env.RESET_EMAIL_FROM || 'ModernStack SaaS <no-reply@yourdomain.com>';
					if (!resendApiKey) {
						console.error('RESEND_API_KEY not set. Unable to send email change verification.');
						return;
					}
					try {
						const res = await fetch('https://api.resend.com/emails', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${resendApiKey}`
							},
							body: JSON.stringify({
								from,
								to: user.email, // Send to current email to approve change
								subject: 'Approve email change',
								...(process.env.RESET_EMAIL_REPLY_TO
									? { reply_to: process.env.RESET_EMAIL_REPLY_TO }
									: {}),
								html: `<p>Hello ${user.name ?? 'there'},</p>
<p>We received a request to change your email address to <strong>${newEmail}</strong>.</p>
<p>Click the button below to approve this change:</p>
<p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;border-radius:6px;text-decoration:none">Approve Email Change</a></p>
<p>If the button doesn't work, copy and paste this URL into your browser:</p>
<p><a href="${url}">${url}</a></p>
<p>If you didn't request this change, please ignore this email or contact support.</p>`
							})
						});
						if (!res.ok) {
							const text = await res.text();
							console.error(
								'Resend API error sending email change verification:',
								res.status,
								text
							);
						}
					} catch (e) {
						console.error('Failed to send email change verification:', e);
					}
				}
			}
		},
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			// Send password reset emails via Resend
			// token and _request are available if you need custom templates or logging
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			sendResetPassword: async ({ user, url, token }, _request) => {
				const resendApiKey = process.env.RESEND_API_KEY;
				const from = process.env.RESET_EMAIL_FROM || 'ModernStack SaaS <no-reply@yourdomain.com>';
				if (!resendApiKey) {
					console.error('RESEND_API_KEY not set. Unable to send reset password email.');
					return;
				}
				const resetUrl = url; // Better Auth provides the full URL with token
				try {
					const res = await fetch('https://api.resend.com/emails', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${resendApiKey}`
						},
						body: JSON.stringify({
							from,
							to: user.email,
							subject: 'Reset your password',
							...(process.env.RESET_EMAIL_REPLY_TO
								? { reply_to: process.env.RESET_EMAIL_REPLY_TO }
								: {}),
							html: `<p>Hello ${user.name ?? 'there'},</p>
<p>We received a request to reset your password. Click the button below to set a new password:</p>
<p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a></p>
<p>If the button doesn't work, copy and paste this URL into your browser:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`
						})
					});
					if (!res.ok) {
						const text = await res.text();
						console.error('Resend API error sending reset email:', res.status, text);
					}
				} catch (e) {
					console.error('Failed to send reset password email:', e);
				}
			}
		},
		socialProviders: {
			...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: process.env.GOOGLE_CLIENT_ID,
							clientSecret: process.env.GOOGLE_CLIENT_SECRET
						}
					}
				: {})
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex(),
			// Admin plugin for roles/impersonation/banning APIs
			admin()
		]
	});
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		try {
			return await authComponent.getAuthUser(ctx);
		} catch {
			// Return null when unauthenticated
			return null;
		}
	}
});
