// json-format：格式化 / 校验 JSON 文本。
export default {
  name: 'json-format',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'json_format',
      description: '格式化 JSON 文本（美化缩进）或校验其合法性，返回结果与错误位置。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要处理的 JSON 文本。' },
          indent: { type: 'number', description: '缩进空格数，默认 2。' },
        },
        required: ['text'],
      },
      output: {
        schema: { type: 'object', properties: { ok: { type: 'boolean' }, message: { type: 'string' }, formatted: { type: 'string' } }, required: ['ok', 'message'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        const indent = typeof args.indent === 'number' && args.indent >= 0 && args.indent <= 8 ? args.indent : 2
        try {
          const parsed = JSON.parse(args.text)
          const formatted = JSON.stringify(parsed, null, indent)
          return { ok: true, formatted, message: 'JSON 合法，已格式化：\n' + formatted }
        } catch (e) {
          return { ok: false, message: 'JSON 无效：' + String(e && e.message ? e.message : e) }
        }
      },
    })
  },
}
