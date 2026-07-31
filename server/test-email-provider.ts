import type { EmailMessage, EmailProvider } from "own-auth";

const inbox: EmailMessage[] = [];

export const testEmailProvider: EmailProvider = {
  async send(message): Promise<void> {
    inbox.push({ ...message });
  }
};

export function listTestEmails(): readonly EmailMessage[] {
  return inbox;
}
