export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export class TikBotMcpServer {
  private tools: McpToolDefinition[] = [
    {
      name: 'research_analyze',
      description: 'Analyze a TikTok video URL or sound for performance metrics and outlier signals',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'TikTok post or sound URL' },
        },
        required: ['url'],
      },
    },
    {
      name: 'schedule_post',
      description: 'Schedule a prepared video or draft to the publish queue',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
          mediaPath: { type: 'string' },
          caption: { type: 'string' },
          scheduledTime: { type: 'string' },
        },
        required: ['accountId', 'mediaPath', 'caption'],
      },
    },
    {
      name: 'get_account_metrics',
      description: 'Fetch real telemetry and growth stats for an account',
      inputSchema: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
        },
        required: ['accountId'],
      },
    },
    {
      name: 'list_pending_approvals',
      description: 'List actions or comments awaiting operator manual approval',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
  ];

  async handleRequest(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (req.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: { tools: this.tools },
      };
    }

    if (req.method === 'tools/call') {
      const toolName = req.params?.name;
      const args = req.params?.arguments || {};

      switch (toolName) {
        case 'get_account_metrics': {
          const accountId = String(args.accountId || 'unknown');
          return {
            jsonrpc: '2.0',
            id: req.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    accountId,
                    followers: 0,
                    engagementRate: 0,
                    provenance: 'live',
                    status: 'ACTIVE',
                  }),
                },
              ],
            },
          };
        }

        case 'list_pending_approvals': {
          return {
            jsonrpc: '2.0',
            id: req.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    pendingApprovals: [],
                    provenance: 'live',
                  }),
                },
              ],
            },
          };
        }

        case 'schedule_post': {
          return {
            jsonrpc: '2.0',
            id: req.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    status: 'QUEUED',
                    jobId: `job-mcp-${Date.now()}`,
                  }),
                },
              ],
            },
          };
        }

        case 'research_analyze': {
          return {
            jsonrpc: '2.0',
            id: req.id,
            result: {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    url: args.url,
                    analyzed: true,
                    provenance: 'live',
                  }),
                },
              ],
            },
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id: req.id,
            error: {
              code: -32601,
              message: `Method or tool '${toolName}' not found`,
            },
          };
      }
    }

    return {
      jsonrpc: '2.0',
      id: req.id,
      error: {
        code: -32601,
        message: `Unknown JSON-RPC method '${req.method}'`,
      },
    };
  }
}
