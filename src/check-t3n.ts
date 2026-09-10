import { connectT3n } from "./t3n.js";

try {
  const { tenantDid } = await connectT3n();

  console.log("Connected as:", tenantDid);
} catch (error) {
  console.error("Failed to connect to T3N:");
  console.error(error);
  process.exit(1);
}
