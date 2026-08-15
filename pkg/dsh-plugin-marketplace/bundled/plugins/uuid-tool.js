// uuid-tool：注册模型工具 uuid_v4，生成随机 UUID v4。
export default {
  name: 'uuid-tool',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'uuid_v4',
      description: '生成一个随机 UUID v4 字符串（小写、标准连字符格式）。',
      parameters: { type: 'object', properties: {}, required: [] },
      output: {
        schema: { type: 'object', properties: { uuid: { type: 'string' } }, required: ['uuid'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.uuid }] },
      },
      async execute() {
        const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        const chars = '0123456789abcdef'
        let out = ''
        for (const ch of pattern) {
          if (ch === '-') { out += '-'; continue }
          const r = Math.floor(Math.random() * 16)
          out += ch === 'x' ? chars[r] : chars[(r & 3) | 8]
        }
        return { uuid: out }
      },
    })
  },
}
