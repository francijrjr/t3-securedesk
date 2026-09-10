import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTicket, getTicket, addComment, escalateTicket } from "../src/github.js";
import { handleSupportRequest } from "../src/agent.js";

const fetchMock = vi.fn();
const issue = { number: 7, title: "ERP", state: "open", body: "Failure", html_url: "https://github.com/test/repo/issues/7" };
const baseUrl = "https://api.github.com/repos/test/repo/issues";

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GITHUB_TOKEN", "test-token");
  vi.stubEnv("GITHUB_OWNER", "test");
  vi.stubEnv("GITHUB_REPO", "repo");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("GitHub operations", () => {
  it("preserves ticket creation", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(issue, { status: 201 }));
    expect(await createTicket("ERP", "Failure")).toEqual(issue);
    expect(fetchMock).toHaveBeenCalledWith(baseUrl, expect.objectContaining({
      method: "POST", body: JSON.stringify({ title: "ERP", body: "Failure" }),
    }));
  });

  it("fetches title, state, description, and URL", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(issue));
    expect(await getTicket(7)).toEqual(issue);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/7`, expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
    }));
    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it("adds the provided comment", async () => {
    const comment = { id: 10, body: "The user reported that the problem persists.", html_url: "https://github.com/test/repo/issues/7#issuecomment-10" };
    fetchMock.mockResolvedValueOnce(Response.json(comment, { status: 201 }));
    expect(await addComment(7, comment.body)).toEqual(comment);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/7/comments`, expect.objectContaining({
      method: "POST", body: JSON.stringify({ body: comment.body }),
    }));
  });

  it("adds priority without replacing existing labels", async () => {
    const labels = [{ name: "bug" }, { name: "priority-high" }];
    fetchMock.mockResolvedValueOnce(Response.json(labels));
    expect(await escalateTicket(7)).toEqual(labels);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}/7/labels`, expect.objectContaining({
      method: "POST", body: JSON.stringify({ labels: ["priority-high"] }),
    }));
  });

  it.each([401, 403, 404, 422, 500])("reports HTTP %s failures for each operation", async (status) => {
    const operations = [
      { run: () => createTicket("ERP", "Failure"), message: "creating" },
      { run: () => getTicket(7), message: "fetching" },
      { run: () => addComment(7, "Text"), message: "commenting on" },
      { run: () => escalateTicket(7), message: "escalating" },
    ];
    for (const operation of operations) {
      fetchMock.mockResolvedValueOnce(Response.json({ message: "Error" }, { status }));
      await expect(operation.run()).rejects.toThrow(`Error ${operation.message} ticket: ${status}`);
    }
  });

  it("propagates connection failures", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(getTicket(7)).rejects.toThrow("fetch failed");
  });

  it("preserves the response used by index.ts", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(issue, { status: 201 }));
    expect(await handleSupportRequest("Failure")).toEqual({
      success: true, ticketNumber: 7, ticketUrl: issue.html_url,
    });
  });
});
