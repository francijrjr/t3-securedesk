import { getGitHubConfig } from "./config.js";

export type GitHubIssue = {
  number: number;
  html_url: string;
  state: string;
  title: string;
  body: string | null;
};

export type GitHubComment = {
  id: number;
  html_url: string;
  body: string;
};

async function githubRequest<T>(
  path: string,
  method: "GET" | "POST",
  body?: object
): Promise<T> {
  const { token, owner, repo } = getGitHubConfig();
  const url = `https://api.github.com/repos/${owner}/${repo}/issues${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("Não foi possível conectar ao GitHub. Verifique a conexão e tente novamente.");
  }

  if (!response.ok) {
    throw new Error(`GitHub retornou HTTP ${response.status}. Verifique o token, as permissões, o repositório e o número do chamado.`);
  }

  return response.json() as Promise<T>;
}

function validateNumber(number: number) {
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error("O número do chamado deve ser um inteiro positivo.");
  }
}

export async function createTicket(title: string, description: string) {
  if (!title.trim() || !description.trim()) {
    throw new Error("Informe o título e a descrição do chamado.");
  }

  return githubRequest<GitHubIssue>("", "POST", {
    title: title.trim(),
    body: description.trim(),
  });
}

export async function getTicket(number: number) {
  validateNumber(number);
  return githubRequest<GitHubIssue>(`/${number}`, "GET");
}

export async function addComment(number: number, comment: string) {
  validateNumber(number);
  if (!comment.trim()) {
    throw new Error("Informe o comentário.");
  }

  return githubRequest<GitHubComment>(`/${number}/comments`, "POST", {
    body: comment.trim(),
  });
}

export async function escalateTicket(number: number) {
  return addComment(
    number,
    "Chamado escalado pelo T3 SecureDesk. Solicito atendimento do suporte de segundo nível."
  );
}
