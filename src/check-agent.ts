import { connectAgentT3n } from "./agent-t3n.js";

try {
  const { agentDid } = await connectAgentT3n();
  console.log("Agent connected.");
  console.log("Agent DID:", agentDid);
} catch (error) {
  let message = error instanceof Error ? error.message : "Unknown error";
  for (const secret of [process.env.AGENT_KEY, process.env.T3N_API_KEY, process.env.T3N_PRIVATE_KEY, process.env.GITHUB_TOKEN]) {
    if (secret) message = message.split(secret).join("[REDACTED]");
  }
  console.error("Failed to connect agent:", message);
  process.exitCode = 1;
}
