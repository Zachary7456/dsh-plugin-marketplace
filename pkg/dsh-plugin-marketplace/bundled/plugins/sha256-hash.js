// sha256-hash：对文本计算 SHA-256 摘要。
import { createHash } from 'node:crypto'

export default {
  name: 'sha256-hash',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'sha256_hash',
      description: '计算文本的 SHA-256 十六进制摘要（也支持返回 base64）。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要计算摘要的文本。' },
          encoding: { type: 'string', description: 'hex 或 base64，默认 hex。' },
        },
        required: ['text'],
      },
      output: {
        schema: { type: 'object', properties: { hash: { type: 'string' }, message: { type: 'string' } }, required: ['hash', 'message'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        const encoding = args.encoding === 'base64' ? 'base64' : 'hex'
        const hash = createHash('sha256').update(String(args.text), 'utf8').digest(encoding)
        return { hash, message: 'SHA-256（' + encoding + '）：' + hash }
      },
    })
  },
}
