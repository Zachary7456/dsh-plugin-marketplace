// timestamp-tool：注册模型工具 timestamp_now，返回当前时间戳。
export default {
  name: 'timestamp-tool',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'timestamp_now',
      description: '返回当前时间的 Unix 时间戳（秒/毫秒）与 ISO-8601 字符串。',
      parameters: { type: 'object', properties: {}, required: [] },
      output: {
        schema: {
          type: 'object',
          properties: {
            unixSeconds: { type: 'number' },
            unixMillis: { type: 'number' },
            iso: { type: 'string' },
          },
          required: ['unixSeconds', 'unixMillis', 'iso'],
          additionalProperties: false,
        },
        render(args, value) {
          return [{ type: 'text', text: 'unix 秒: ' + value.unixSeconds + '\nunix 毫秒: ' + value.unixMillis + '\nISO: ' + value.iso }]
        },
      },
      async execute() {
        const now = new Date()
        return { unixSeconds: Math.floor(now.getTime() / 1000), unixMillis: now.getTime(), iso: now.toISOString() }
      },
    })
  },
}
