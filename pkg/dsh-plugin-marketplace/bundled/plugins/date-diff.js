// date-diff：计算两个日期之间的天数。
export default {
  name: 'date-diff',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'date_diff',
      description: '计算两个日期（YYYY-MM-DD 或 ISO 日期）之间的天数差；第二个日期缺省时用今天。',
      parameters: {
        type: 'object',
        properties: {
          from: { type: 'string', description: '起始日期，如 2026-01-01。' },
          to: { type: 'string', description: '结束日期，缺省为今天。' },
        },
        required: ['from'],
      },
      output: {
        schema: { type: 'object', properties: { days: { type: 'number' }, message: { type: 'string' } }, required: ['days', 'message'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        const from = new Date(String(args.from))
        const to = args.to ? new Date(String(args.to)) : new Date()
        if (isNaN(from.getTime()) || isNaN(to.getTime())) return { days: 0, message: '日期格式无法解析（请用 YYYY-MM-DD）' }
        const days = Math.round((to.getTime() - from.getTime()) / 86400000)
        return { days, message: '相差 ' + days + ' 天（' + from.toISOString().slice(0, 10) + ' → ' + to.toISOString().slice(0, 10) + '）' }
      },
    })
  },
}
