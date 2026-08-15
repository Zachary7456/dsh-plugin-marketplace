# PowerShell 脚本编写规范

- 使用已批准动词开头的函数名（Get/Set/New/Test…），PascalCase
- 参数声明类型与 [Parameter()] 特性；必填参数用 [Parameter(Mandatory)]
- 优先使用 cmdlet 与核心类型，避免 COM 与反射
- 错误处理：$ErrorActionPreference = 'Stop'，调用外部命令后检查 $LASTEXITCODE
- 输出对象而不是格式化字符串；格式化留给 Format-Table 或调用方
- 脚本头部注释说明用途与副作用
