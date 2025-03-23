#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
// 配置常量
const DEFAULT_WIDTH = 1024;
const DEFAULT_HEIGHT = 1024;
const IMAGE_API_BASE_URL = 'https://image.pollinations.ai/prompt';
// 验证图片生成参数
const isValidImageGenerationArgs = (args) => {
    if (!args || typeof args !== 'object')
        return false;
    const { prompt_zh, width, height } = args;
    if (!prompt_zh || typeof prompt_zh !== 'string')
        return false;
    if (width && (typeof width !== 'number' || width < 1))
        return false;
    if (height && (typeof height !== 'number' || height < 1))
        return false;
    return true;
};
/**
 * 创建并配置MCP服务器
 * @returns 配置好的Server实例
 */
const createServer = () => {
    // 初始化服务器
    const server = new Server({
        name: 'image-generation-mcp',
        version: '0.1.0',
    }, {
        capabilities: {
            tools: {}, // 工具配置将在下面注册
        },
    });
    // 注册可用工具列表
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
                            description: `图片宽度（可选，默认${DEFAULT_WIDTH}）`,
                            minimum: 1,
                        },
                        height: {
                            type: 'number',
                            description: `图片高度（可选，默认${DEFAULT_HEIGHT}）`,
                            minimum: 1,
                        },
                    },
                    required: ['prompt_zh'],
                },
            },
        ],
    }));
    // 处理工具调用请求
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name !== 'generate_image') {
            throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${request.params.name}`);
        }
        // 验证参数格式
        if (!isValidImageGenerationArgs(request.params.arguments)) {
            throw new McpError(ErrorCode.InvalidParams, '请求参数格式错误，请检查输入参数');
        }
        // 解构参数并设置默认值
        const { prompt_zh, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT } = request.params.arguments;
        // 构建图片URL
        const queryParams = new URLSearchParams({
            width: width.toString(),
            height: height.toString(),
            enhance: 'true',
            private: 'true',
            nologo: 'true',
            safe: 'true',
            model: 'flux',
        });
        const imageUrl = `${IMAGE_API_BASE_URL}/${encodeURIComponent(prompt_zh)}?${queryParams}`;
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        description: prompt_zh,
                        imageUrl: imageUrl,
                    }, null, 4),
                },
            ],
        };
    });
    return server;
};
async function main() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}
// 启动服务
main().catch((error) => {
    console.error('main error: ', error);
    process.exit(1);
});
