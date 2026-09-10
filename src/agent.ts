import { createTicket } from "./github.js";

export async function handleSupportRequest(message: string) {
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error("Report the user's problem.");
  }

  const ticket = await createTicket(
    "Call created by T3 SecureDesk",
    cleanMessage
  );

  return {
    success: true,
    ticketNumber: ticket.number,
    ticketUrl: ticket.html_url,
  };
}
