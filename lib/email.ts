import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === 'development') {
    // For development, use Ethereal Email (fake SMTP)
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
  }

  // For production, use your actual email service
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Email templates
const getEmailTemplate = (type: 'verification' | 'reset', data: any) => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  
  switch (type) {
    case 'verification':
      return {
        subject: 'Verify your CodeCircle account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #14213d; margin: 0;">CodeCircle</h1>
              <p style="color: #666; margin: 5px 0;">Where Developers Connect, Share & Grow</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #14213d; margin-top: 0;">Welcome to CodeCircle, ${data.name}!</h2>
              <p style="color: #333; line-height: 1.6;">
                Thank you for joining our community of developers. To complete your registration and start showcasing your projects, please verify your email address.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/auth/verify-email?token=${data.token}" 
                   style="background: #fca311; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${baseUrl}/auth/verify-email?token=${data.token}" style="color: #fca311;">
                  ${baseUrl}/auth/verify-email?token=${data.token}
                </a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This verification link will expire in 24 hours. If you didn't create an account with CodeCircle, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>© 2024 CodeCircle. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
    case 'reset':
      return {
        subject: 'Reset your CodeCircle password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #14213d; margin: 0;">CodeCircle</h1>
              <p style="color: #666; margin: 5px 0;">Where Developers Connect, Share & Grow</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #14213d; margin-top: 0;">Password Reset Request</h2>
              <p style="color: #333; line-height: 1.6;">
                Hi ${data.name},<br><br>
                We received a request to reset your password for your CodeCircle account. If you made this request, click the button below to reset your password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/auth/reset-password?token=${data.token}" 
                   style="background: #fca311; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${baseUrl}/auth/reset-password?token=${data.token}" style="color: #fca311;">
                  ${baseUrl}/auth/reset-password?token=${data.token}
                </a>
              </p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; color: #666; font-size: 12px;">
              <p>© 2024 CodeCircle. All rights reserved.</p>
            </div>
          </div>
        `
      };
      
    default:
      throw new Error('Invalid email template type');
  }
};

// Send verification email
export const sendVerificationEmail = async (email: string, token: string, name: string) => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate('verification', { token, name });
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@codecircle.dev',
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(result));
    }
    
    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, token: string, name: string) => {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate('reset', { token, name });
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@codecircle.dev',
      to: email,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(result));
    }
    
    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};