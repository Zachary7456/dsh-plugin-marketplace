// random-string：生成随机字符串（密码、临时 token 等）。
export default {
  name: 'random-string',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'random_string',
      description: '生成指定长度的随机字符串，可选用数字、字母、符号组合。',
      parameters: {
        type: 'object',
        properties: {
          length: { type: 'number', description: '长度，默认 16，最大 256。' },
          charset: { type: 'string', description: '字符集：alnum（默认）/alpha/numeric/alnum-symbol。' },
        },
        required: [],
      },
      output: {
        schema: { type: 'object', properties: { value: { type: 'string' }, message: { type: 'string' } }, required: ['value', 'message'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        const length = Math.max(1, Math.min(256, typeof args.length === 'number' ? Math.floor(args.length) : 16))
        const sets = {
          alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
          numeric: '0123456789',
          'alnum-symbol': 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_=+',
        }
        const charset = sets[args.charset] || sets['alnum-symbol'].slice(0, 62)
        let out = ''
        for (let i = 0; i < length; i++) out += charset[Math.floor(Math.random() * charset.length)]
        return { value: out, message: '随机字符串（长度 ' + length + '）：' + out }
      },
    })
  },
}
