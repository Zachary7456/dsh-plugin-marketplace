// char-count：注册模型工具 char_count，统计文本的字符/单词/行数。
export default {
  name: 'char-count',
  apply(ctx) {
    const tools = ctx.get('tools')
    if (tools === undefined) return
    tools.register({
      name: 'char_count',
      description: '统计文本的字符数、单词数与行数。参数 text 为输入文本。',
      parameters: {
        type: 'object',
        properties: { text: { type: 'string', description: '要统计的文本。' } },
        required: ['text'],
      },
      output: {
        schema: {
          type: 'object',
          properties: {
            chars: { type: 'number' },
            words: { type: 'number' },
            lines: { type: 'number' },
          },
          required: ['chars', 'words', 'lines'],
          additionalProperties: false,
        },
        render(args, value) {
          return [{ type: 'text', text: '字符: ' + value.chars + ' / 单词: ' + value.words + ' / 行: ' + value.lines }]
        },
      },
      async execute(args) {
        const t = String(args.text)
        const words = (t.trim().match(/\S+/g) || []).length
        return { chars: t.length, words, lines: t === '' ? 0 : t.split('\n').length }
      },
    })
  },
}
