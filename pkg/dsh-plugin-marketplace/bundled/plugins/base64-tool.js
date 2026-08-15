// base64-tool：注册模型工具 base64_text，对文本做 Base64 编解码（UTF-8 安全）。
export default {
  name: 'base64-tool',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'base64_text',
      description: '对文本做 Base64 编码或解码。参数 mode（encode/decode）与 text；decode 时 text 为 Base64 字符串。',
      parameters: {
        type: 'object',
        properties: {
          mode: { type: 'string', enum: ['encode', 'decode'], description: '编码还是解码。' },
          text: { type: 'string', description: '输入文本。' },
        },
        required: ['mode', 'text'],
      },
      output: {
        schema: { type: 'object', properties: { result: { type: 'string' } }, required: ['result'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.result }] },
      },
      async execute(args) {
        if (args.mode === 'encode') {
          return { result: btoa(unescape(encodeURIComponent(args.text))) }
        }
        return { result: decodeURIComponent(escape(atob(args.text))) }
      },
    })
  },
}
