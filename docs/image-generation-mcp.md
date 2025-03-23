# 图像生成MCP项目文档

## 项目背景
实现通过MCP工具将中文简短描述转换为详细画面并生成图片链接的功能

## 已确定需求
1. 工具名称：image-generation-mcp
2. 输入参数：
   - prompt_zh (必填): 中文描述
   - width (可选): 图片宽度，默认1024
   - height (可选): 图片高度，默认1024
3. 输出要求：
   - 包含完整画面描述
   - 可直接访问的图片链接

## 技术方案
```typescript
// URL构造逻辑示例
const promptEn = `A detailed scene of: ${args.prompt_zh}`;
const encodedPrompt = encodeURIComponent(promptEn);
return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${args.width}&height=${args.height}&enhance=true&private=true&nologo=true&safe=true&model=flux`;
```

## 待实现功能
- [ ] 创建MCP服务器框架
- [ ] 实现参数校验逻辑
- [ ] 集成URL编码模块
- [ ] 编写测试用例

## 关键决策记录
1. 2025-03-23 15:02 确认直接使用模型生成英文描述
2. 2025-03-23 15:04 增加图片尺寸参数配置
3. 2025-03-23 15:05 确定工具输入输出规范
