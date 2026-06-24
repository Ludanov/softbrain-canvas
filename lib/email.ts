/**
 * Email Service
 * 
 * Supports both Resend API and SMTP for sending emails.
 * Configure via environment variables.
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export interface ContactFormEmail {
  name: string;
  email: string;
  subject: string;
  message: string;
}

import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { 
  renderOrderConfirmationEmail, 
  renderShippingEmail, 
  renderDeliveryEmail,
  OrderEmailData 
} from './email-templates';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Create SMTP transporter if SMTP is configured
const smtpTransporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE !== 'false', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

/**
 * Send a generic email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const fromAddress = options.from || process.env.EMAIL_FROM || 'hello@softbrain.space';

  // Try SMTP first if configured
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
      });

      console.log('✓ Email sent via SMTP:', info.messageId);
      return true;
    } catch (error) {
      console.error('SMTP error:', error);
      // Fall through to try Resend or log
    }
  }

  // Try Resend if configured
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html || '',
      });

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log('✓ Email sent via Resend:', data?.id);
      return true;
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      return false;
    }
  }

  // No email service configured - log to console
  console.log('📧 Email service not configured. Logging to console:', {
    to: options.to,
    subject: options.subject,
    from: fromAddress,
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Email content:', options.text || options.html);
    return true;
  }
  
  return false;
}

/**
 * Send contact form notification to admin
 */
export async function sendContactFormNotification(data: ContactFormEmail): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@softbrain.space';
  
  const html = `
    <h2>New Contact Form Submission</h2>
    <p><strong>From:</strong> ${data.name} (${data.email})</p>
    <p><strong>Subject:</strong> ${data.subject}</p>
    <p><strong>Message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br>')}</p>
    <hr>
    <p><small>Sent from SoftBrain Space contact form</small></p>
  `;
  
  const text = `
New Contact Form Submission

From: ${data.name} (${data.email})
Subject: ${data.subject}

Message:
${data.message}

---
Sent from SoftBrain Space contact form
  `;
  
  return sendEmail({
    to: adminEmail,
    subject: `Contact Form: ${data.subject}`,
    html,
    text,
  });
}

/**
 * Send auto-reply to contact form submitter
 */
export async function sendContactFormAutoReply(data: ContactFormEmail): Promise<boolean> {
  const html = `
    <h2>Thank you for contacting SoftBrain Space!</h2>
    <p>Hi ${data.name},</p>
    <p>We've received your message and will get back to you as soon as possible.</p>
    <p><strong>Your message:</strong></p>
    <p>${data.message.replace(/\n/g, '<br>')}</p>
    <hr>
    <p>Best regards,<br>The SoftBrain Space Team</p>
  `;
  
  const text = `
Thank you for contacting SoftBrain Space!

Hi ${data.name},

We've received your message and will get back to you as soon as possible.

Your message:
${data.message}

---
Best regards,
The SoftBrain Space Team
  `;
  
  return sendEmail({
    to: data.email,
    subject: 'Thank you for contacting SoftBrain Space',
    html,
    text,
  });
}

/**
 * Send email verification
 */
export async function sendEmailVerification(email: string, token: string, name?: string): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?token=${token}`;
  
  const html = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${name || 'there'},</p>
    <p>Thank you for registering with SoftBrain Space! Please verify your email address by clicking the button below:</p>
    <p style="margin: 30px 0;">
      <a href="${verificationUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Verify Email Address
      </a>
    </p>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${verificationUrl}">${verificationUrl}</a></p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't create an account, you can safely ignore this email.</p>
    <hr>
    <p>Best regards,<br>The SoftBrain Space Team</p>
  `;
  
  const text = `
Verify Your Email Address

Hi ${name || 'there'},

Thank you for registering with SoftBrain Space! Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
Best regards,
The SoftBrain Space Team
  `;
  
  return sendEmail({
    to: email,
    subject: 'Verify Your Email - SoftBrain Space',
    html,
    text,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmation(order: OrderEmailData) {
  if (!resend) {
    console.warn('Email service not configured, skipping order confirmation');
    return;
  }

  try {
    await sendEmail({
      to: order.customer_email,
      subject: `Order Confirmation #${order.order_number} - SoftBrain Space`,
      html: renderOrderConfirmationEmail(order),
    });
    console.log(`✓ Order confirmation sent to ${order.customer_email}`);
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    throw error;
  }
}

/**
 * Send shipping notification email
 */
export async function sendShippingNotification(order: OrderEmailData) {
  if (!resend) {
    console.warn('Email service not configured, skipping shipping notification');
    return;
  }

  try {
    await sendEmail({
      to: order.customer_email,
      subject: `Your Order #${order.order_number} Has Shipped! 📦`,
      html: renderShippingEmail(order),
    });
    console.log(`✓ Shipping notification sent to ${order.customer_email}`);
  } catch (error) {
    console.error('Failed to send shipping notification:', error);
    throw error;
  }
}

/**
 * Send delivery confirmation email
 */
export async function sendDeliveryConfirmation(order: OrderEmailData) {
  if (!resend) {
    console.warn('Email service not configured, skipping delivery confirmation');
    return;
  }

  try {
    await sendEmail({
      to: order.customer_email,
      subject: `Your Order #${order.order_number} Has Been Delivered`,
      html: renderDeliveryEmail(order),
    });
    console.log(`✓ Delivery confirmation sent to ${order.customer_email}`);
  } catch (error) {
    console.error('Failed to send delivery confirmation:', error);
    throw error;
  }
}
