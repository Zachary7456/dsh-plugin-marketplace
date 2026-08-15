// case-tool：注册模型工具 case_convert，在常见命名风格之间转换标识符。
export default {
  name: 'case-tool',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'case_convert',
      description: '在 camelCase / PascalCase / snake_case / kebab-case 之间转换标识符。参数 text 为输入，mode 为目标格式（camel/pascal/snake/kebab）。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要转换的标识符或短语。' },
          mode: { type: 'string', enum: ['camel', 'pascal', 'snake', 'kebab'], description: '目标命名风格。' },
        },
        required: ['text', 'mode'],
      },
      output: {
        schema: { type: 'object', properties: { result: { type: 'string' } }, required: ['result'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.result }] },
      },
      async execute(args) {
        const raw = String(args.text).trim()
        const words = raw
          .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .split(/[^a-zA-Z0-9]+/)
          .map((w) => w.toLowerCase())
          .filter(Boolean)
        if (words.length === 0) return { result: '' }
        const upper = (w) => w.charAt(0).toUpperCase() + w.slice(1)
        if (args.mode === 'camel') return { result: words[0] + words.slice(1).map(upper).join('') }
        if (args.mode === 'pascal') return { result: words.map(upper).join('') }
        if (args.mode === 'snake') return { result: words.join('_') }
        return { result: words.join('-') }
      },
    })
  },
}
