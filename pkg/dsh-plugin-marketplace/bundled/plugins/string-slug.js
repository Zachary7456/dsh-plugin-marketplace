// string-slug：把文本转成 URL 友好的 slug。
export default {
  name: 'string-slug',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'string_slug',
      description: '把任意文本转换为 URL 友好的 slug（小写、空格与符号转连字符），支持中文保留或转拼音占位。',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要转换的文本。' },
          keepCjk: { type: 'boolean', description: '是否保留中日韩字符（默认 true）。' },
        },
        required: ['text'],
      },
      output: {
        schema: { type: 'object', properties: { slug: { type: 'string' }, message: { type: 'string' } }, required: ['slug', 'message'], additionalProperties: false },
        render(args, value) { return [{ type: 'text', text: value.message }] },
      },
      async execute(args) {
        let s = String(args.text).trim().toLowerCase()
        if (args.keepCjk !== false) {
          s = s.replace(/([\u4e00-\u9fff]+)/g, function (m) { return '-' + m + '-' })
        }
        s = s.replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '')
        return { slug: s, message: 'slug：' + s }
      },
    })
  },
}
