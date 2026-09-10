import { createTicket, getTicket, addComment, escalateTicket } from "./github.js";

type TicketRequest =
  | { action: "create"; title: string; description: string }
  | { action: "get"; number: number }
  | { action: "comment"; number: number; comment: string }
  | { action: "escalate"; number: number };

export async function handleTicketRequest(request: TicketRequest) {
  switch (request.action) {
    case "create":
      return createTicket(request.title, request.description);
    case "get":
      return getTicket(request.number);
    case "comment":
      return addComment(request.number, request.comment);
    case "escalate":
      return escalateTicket(request.number);
  }
}

export async function handleSupportRequest(message: string) {
  const ticket = await createTicket("Call created by T3 SecureDesk", message);
  return {
    success: true,
    ticketNumber: ticket.number,
    ticketUrl: ticket.html_url,
  };
}
