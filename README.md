# T3 SecureDesk

Agente empresarial simples para abertura de chamados de suporte usando Terminal 3 ADK.

## Objetivo

O projeto prioriza código pequeno, explícito e fácil de manter.

Fluxo inicial:

```text
Usuário
  -> T3 SecureDesk
  -> autenticação T3N
  -> GitHub Issues
```

> Esta é a primeira etapa do MVP. Na etapa seguinte, a ação externa será movida para um contrato TEE do Terminal 3.

## Instalação

```bash
npm install
```

Copie:

```bash
cp .env.example .env
```

Configure as variáveis no `.env`.

Nunca envie o `.env` para o GitHub.

Configure `T3N_API_KEY` e `DID` com os valores fornecidos pelo Terminal 3.
A API key do T3 é uma chave privada Ethereum (64 caracteres hexadecimais,
com prefixo `0x` opcional), usada localmente para assinar a autenticação.
O DID configurado é conferido após a autenticação; ele não substitui a chave.
Também são aceitos `T3N_PRIVATE_KEY` e `T3N_DID`, com prioridade sobre os nomes acima.

## Testar conexão T3N

```bash
npm run check:t3n
```

Resultado esperado:

```text
Connected as: did:t3n:...
```

## Criar chamado

```bash
npm run dev -- "Não consigo acessar o ERP"
```

## Estrutura

```text
src/
  config.ts
  t3n.ts
  github.ts
  agent.ts
  index.ts
  check-t3n.ts
```

Cada arquivo tem uma responsabilidade pequena e direta.

## Próxima etapa

Implementar o contrato TEE e executar a ação protegida através do Terminal 3.
