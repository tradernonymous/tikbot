import { describe, it, expect, beforeEach } from 'vitest';
import {
  TikBotMcpServer,
  type JsonRpcRequest,
} from '../tikbot-mcp-server';

describe('T7.4 TikBot MCP Server Tools & Protocol', () => {
  let server: TikBotMcpServer;

  beforeEach(() => {
    server = new TikBotMcpServer();
  });

  it('lists available MCP tools via tools/list', async () => {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    };

    const res = await server.handleRequest(req);
    expect(res.jsonrpc).toBe('2.0');
    expect(res.id).toBe(1);
    expect(res.result).toBeDefined();
    const toolNames = res.result.tools.map((t: any) => t.name);
    expect(toolNames).toContain('research_analyze');
    expect(toolNames).toContain('schedule_post');
    expect(toolNames).toContain('get_account_metrics');
    expect(toolNames).toContain('list_pending_approvals');
  });

  it('executes get_account_metrics tool with real data structure and provenance', async () => {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_account_metrics',
        arguments: { accountId: 'acc-test-1' },
      },
    };

    const res = await server.handleRequest(req);
    expect(res.error).toBeUndefined();
    expect(res.result?.content).toBeDefined();
    const text = res.result.content[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.accountId).toBe('acc-test-1');
    expect(parsed.provenance).toBeDefined();
  });

  it('executes list_pending_approvals tool', async () => {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_pending_approvals',
        arguments: {},
      },
    };

    const res = await server.handleRequest(req);
    expect(res.error).toBeUndefined();
    const parsed = JSON.parse(res.result.content[0].text);
    expect(Array.isArray(parsed.pendingApprovals)).toBe(true);
  });

  it('returns JSON-RPC error -32601 on unknown tool or method', async () => {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'unknown_magic_tool',
        arguments: {},
      },
    };

    const res = await server.handleRequest(req);
    expect(res.error).toBeDefined();
    expect(res.error?.code).toBe(-32601);
  });
});
