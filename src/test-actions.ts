import { getTicket, addComment, escalateTicket } from "./github.js";

const ticketNumber = Number(process.argv[2] ?? "1");

try {
  if (!Number.isSafeInteger(ticketNumber) || ticketNumber <= 0) {
    throw new Error("Informe um número de chamado inteiro e positivo.");
  }

  const ticket = await getTicket(ticketNumber);
  console.log("Chamado:");
  console.log(ticket.title);
  console.log(ticket.state);

  await addComment(ticketNumber, "Usuário informou que o problema continua.");
  console.log("\nComentário adicionado.");

  await escalateTicket(ticketNumber);
  console.log("Chamado escalado.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Erro ao testar as operações.");
  process.exitCode = 1;
}
