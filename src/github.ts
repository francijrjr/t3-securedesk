import { getGitHubConfig } from "./config.js";

type GitHubIssue = {
  number: number;
  title: string;
  html_url: string;
  state: string;
  body: string | null;
};

type GitHubComment = {
  id: number;
  html_url: string;
  body: string;
};

export async function createTicket(
  title: string,
  description: string
): Promise<GitHubIssue> {
  const github = getGitHubConfig();
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, body: description }),
  });

  if (!response.ok) {
    throw new Error(`Error creating ticket: ${response.status}`);
  }

  return response.json();
}

export async function getTicket(ticketNumber: number): Promise<GitHubIssue> {
  const github = getGitHubConfig();
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${ticketNumber}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Error fetching ticket: ${response.status}`);
  }

  return response.json();
}

export async function addComment(
  ticketNumber: number,
  comment: string
): Promise<GitHubComment> {
  const github = getGitHubConfig();
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${ticketNumber}/comments`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ body: comment }),
  });

  if (!response.ok) {
    throw new Error(`Error commenting on ticket: ${response.status}`);
  }

  return response.json();
}

export async function escalateTicket(ticketNumber: number): Promise<{ name: string }[]> {
  const github = getGitHubConfig();
  const url = `https://api.github.com/repos/${github.owner}/${github.repo}/issues/${ticketNumber}/labels`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${github.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ labels: ["priority-high"] }),
  });

  if (!response.ok) {
    throw new Error(`Error escalating ticket: ${response.status}`);
  }

  return response.json();
}
