#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

interface ImageGenerationArgs {
  prompt_zh: string;
  width?: number;
  height?: number;
}

const isValidImageGenerationArgs = (args: any): args is ImageGenerationArgs => {
  if (typeof args !== 'object' || args === null) return false;
  if (typeof args.prompt_zh !== 'string' || !args.prompt_zh.trim()) return false;
  
  if (args.width !== undefined && (typeof args.width !== 'number' || args.width < 1)) return false;
  if (args.height !== undefined && (typeof args.height !== 'number' || args.height < 1)) return false;
  
  return true;
};

const createServer = () => {
  const server = new Server(
    {
      name: 'image-generation-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'generate_image',
        description: '将中文描述转换为详细画面并生成图片链接',
        inputSchema: {
          type: 'object',
          properties: {
            prompt_zh: {
              type: 'string',
              description: '中文场景描述',
            },
            width: {
              type: 'number',
              description: '图片宽度（可选，默认1024）',
              minimum: 1,
            },
            height: {
              type: 'number',
              description: '图片高度（可选，默认1024）',
              minimum: 1,
            },
          },
          required: ['prompt_zh'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'generate_image') {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `未知工具: ${request.params.name}`
      );
    }

    if (!isValidImageGenerationArgs(request.params.arguments)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        '无效的参数'
      );
    }

    const { prompt_zh, width = 1024, height = 1024 } = request.params.arguments;
    
    try {
      // 扩写中文描述，补充细节
      const detailedZh = `详细场景：${prompt_zh}。场景中包含以下细节：
在一个戏剧性的环境中，充满紧张和动感的氛围，光影交错，细节丰富。人物表情生动，动作富有张力，
周围环境细节完整，包括建筑物、天气效果、光线变化等。整体画面构图饱满，色彩对比鲜明。`;
      
      // 将详细的中文描述转换为英文
      const promptEn = `A cinematic and dramatic scene depicting ${prompt_zh}, with the following details:
In a dramatic setting filled with tension and dynamic energy, featuring interplay of light and shadows, rich in detail.
Characters display vivid expressions and powerful poses, surrounded by complete environmental details including architecture,
weather effects, and lighting variations. The overall composition is full and balanced with striking color contrasts.`;
      const encodedPrompt = encodeURIComponent(promptEn);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&enhance=true&private=true&nologo=true&safe=true&model=flux`;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              description: promptEn,
              imageUrl: imageUrl
            }, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `生成图片链接时出错: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  server.onerror = (error) => console.error('[MCP Error]', error);
  
  return server;
};

const main = async () => {
  const server = createServer();
  const transport = new StdioServerTransport();
  
  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('图像生成MCP服务器已启动');
};

main().catch(console.error);
