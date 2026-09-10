import { getTicket, addComment, escalateTicket } from "./github.js";

const ticketNumber = Number(process.argv[2] ?? "1");

try {
  if (!Number.isSafeInteger(ticketNumber) || ticketNumber <= 0) {
    throw new Error("Enter a positive integer ticket number.");
  }

  const ticket = await getTicket(ticketNumber);
  console.log("Ticket:");
  console.log(ticket.title);
  console.log(ticket.state);

  await addComment(ticketNumber, "The user reported that the problem persists.");
  console.log("\nComment added.");

  await escalateTicket(ticketNumber);
  console.log("Ticket escalated.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Error testing ticket operations.");
  process.exitCode = 1;
}
