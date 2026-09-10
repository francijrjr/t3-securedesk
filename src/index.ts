import { connectT3n } from "./t3n.js";
import { handleSupportRequest } from "./agent.js";

const message = process.argv.slice(2).join(" ").trim();

if (!message) {
  console.log(
    'Usage: npm run dev -- "I cannot access the ERP"'
  );
  process.exit(0);
}

try {
  const { tenantDid } = await connectT3n();

  console.log("Connected to T3N:", tenantDid);

  const result = await handleSupportRequest(message);

  console.log("");
  console.log("Ticket created successfully.");
  console.log("Number:", result.ticketNumber);
  console.log("URL:", result.ticketUrl);
} catch (error) {
  console.error("Error creating ticket:");
  console.error(error);
  process.exit(1);
}
