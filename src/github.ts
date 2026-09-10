import { getGitHubConfig } from "./config.js";

type GitHubIssue = {
  number: number;
  html_url: string;
  state: string;
  title: string;
};

export async function createTicket(
  title: string,
  description: string
): Promise<GitHubIssue> {
  const github = getGitHubConfig();

  const url =
    `https://api.github.com/repos/${github.owner}/${github.repo}/issues`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title,
      body: description,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `GitHub retornou ${response.status}: ${errorBody}`
    );
  }

  return response.json() as Promise<GitHubIssue>;
}
