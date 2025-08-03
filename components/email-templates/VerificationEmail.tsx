// components/email-templates/VerificationEmail.tsx
import * as React from 'react';

interface EmailTemplateProps {
  verificationLink: string;
}

export const EmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  verificationLink,
}) => (
  <div>
    <h1>Verify Your Email</h1>
    <p>Click the link below to verify your email address:</p>
    <a href={verificationLink}>Verify Email</a>
    <p>If you didn't request this, please ignore this email.</p>
  </div>
);