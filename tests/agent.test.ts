import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTicket, getTicket, addComment, escalateTicket } from "../src/github.js";
import { handleSupportRequest, handleTicketRequest } from "../src/agent.js";

const fetchMock = vi.fn();
const issue = { number: 7, html_url: "https://github.com/test/repo/issues/7", state: "open", title: "ERP", body: "Falha" };
const comment = { id: 10, html_url: `${issue.html_url}#issuecomment-10`, body: "Comentário" };
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

function respond(data: object, status = 200) {
  fetchMock.mockResolvedValueOnce(Response.json(data, { status }));
}

function expectRequest(path: string, method: string, body?: object) {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith(`${baseUrl}${path}`, expect.objectContaining({
    method,
    headers: expect.objectContaining({ Authorization: "Bearer test-token" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
}

describe("operações GitHub", () => {
  it("cria um chamado", async () => {
    respond(issue, 201);
    expect(await createTicket(" ERP ", " Falha ")).toEqual(issue);
    expectRequest("", "POST", { title: "ERP", body: "Falha" });
  });

  it("consulta um chamado", async () => {
    respond(issue);
    expect(await getTicket(7)).toEqual(issue);
    expectRequest("/7", "GET");
  });

  it("adiciona um comentário", async () => {
    respond(comment, 201);
    expect(await addComment(7, " Comentário ")).toEqual(comment);
    expectRequest("/7/comments", "POST", { body: "Comentário" });
  });

  it("registra o pedido de escalonamento como comentário", async () => {
    respond(comment, 201);
    expect(await escalateTicket(7)).toEqual(comment);
    expectRequest("/7/comments", "POST", {
      body: "Chamado escalado pelo T3 SecureDesk. Solicito atendimento do suporte de segundo nível.",
    });
  });

  it.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])("rejeita número inválido: %s", async (number) => {
    await expect(getTicket(number)).rejects.toThrow("inteiro positivo");
    await expect(addComment(number, "Texto")).rejects.toThrow("inteiro positivo");
    await expect(escalateTicket(number)).rejects.toThrow("inteiro positivo");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejeita textos vazios antes da requisição", async () => {
    await expect(createTicket(" ", "Descrição")).rejects.toThrow("título");
    await expect(createTicket("Título", " ")).rejects.toThrow("descrição");
    await expect(addComment(7, " ")).rejects.toThrow("comentário");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 403, 404, 422, 500])("informa erro HTTP %s", async (status) => {
    respond({ message: "Erro" }, status);
    await expect(getTicket(7)).rejects.toThrow(`HTTP ${status}`);
  });

  it("informa erro de rede sem vazar o erro original", async () => {
    fetchMock.mockRejectedValueOnce(new Error("test-token"));
    await expect(createTicket("Título", "Descrição")).rejects.toThrow("Não foi possível conectar ao GitHub");
  });
});

describe("organização das chamadas", () => {
  it("mantém o retorno usado pelo index.ts", async () => {
    respond(issue, 201);
    expect(await handleSupportRequest("Falha")).toEqual({
      success: true, ticketNumber: 7, ticketUrl: issue.html_url,
    });
  });

  it("encaminha as quatro ações", async () => {
    respond(issue, 201);
    expect(await handleTicketRequest({ action: "create", title: "ERP", description: "Falha" })).toEqual(issue);
    respond(issue);
    expect(await handleTicketRequest({ action: "get", number: 7 })).toEqual(issue);
    respond(comment, 201);
    expect(await handleTicketRequest({ action: "comment", number: 7, comment: "Texto" })).toEqual(comment);
    respond(comment, 201);
    expect(await handleTicketRequest({ action: "escalate", number: 7 })).toEqual(comment);
    expect(fetchMock.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      [baseUrl, "POST"], [`${baseUrl}/7`, "GET"],
      [`${baseUrl}/7/comments`, "POST"], [`${baseUrl}/7/comments`, "POST"],
    ]);
  });
});
