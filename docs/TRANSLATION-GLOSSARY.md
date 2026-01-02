# PocketBase.cn Translation Glossary

This document maintains consistent terminology for translating PocketBase technical documentation into Chinese.

## Core Terms

| English               | Chinese    | Notes                     |
| --------------------- | ---------- | ------------------------- |
| PocketBase            | PocketBase | Keep as is (product name) |
| Collection            | 集合       | 数据库集合                |
| Record                | 记录       | 单条数据记录              |
| Field                 | 字段       | 数据字段                  |
| Auth / Authentication | 认证       | 用户身份验证              |
| Authorization         | 授权       | 权限控制                  |
| API Rule              | API 规则   | 访问控制规则              |
| Expand                | 扩展       | 关联查询                  |
| Relation              | 关联       | 关系字段                  |
| View                  | 视图       | 数据库视图                |
| Migration             | 迁移       | 数据库迁移                |
| Hook                  | 钩子       | 事件钩子                  |
| Middleware            | 中间件     | 请求处理中间件            |
| Realtime              | 实时       | 实时订阅/更新             |
| Subscription          | 订阅       | 实时订阅                  |
| Token                 | Token      | 保持原文                  |
| OAuth2                | OAuth2     | 保持原文                  |

## Database Terms

| English     | Chinese   | Notes      |
| ----------- | --------- | ---------- |
| Primary Key | 主键      | 唯一标识   |
| Foreign Key | 外键      | 关联键     |
| Index       | 索引      | 数据库索引 |
| Query       | 查询      | 数据查询   |
| Filter      | 过滤/筛选 | 条件过滤   |
| Sort        | 排序      | 数据排序   |
| Pagination  | 分页      | 结果分页   |
| Transaction | 事务      | 数据库事务 |
| Schema      | 结构/模式 | 数据库结构 |

## Field Types

| English        | Chinese | Notes         |
| -------------- | ------- | ------------- |
| Text           | 文本    | 短文本        |
| Editor         | 编辑器  | 长文本/富文本 |
| Number         | 数字    | 数值类型      |
| Bool / Boolean | 布尔值  | 是/否         |
| Email          | 邮箱    | 邮箱地址      |
| URL            | 链接    | URL 地址      |
| Date           | 日期    | 日期类型      |
| Select         | 选择    | 下拉选择      |
| File           | 文件    | 文件上传      |
| Relation       | 关联    | 关联字段      |
| User           | 用户    | 关联用户      |

## API Terms

| English     | Chinese   | Notes                     |
| ----------- | --------- | ------------------------- |
| Endpoint    | 端点/接口 | API 接口                  |
| Request     | 请求      | HTTP 请求                 |
| Response    | 响应      | HTTP 响应                 |
| Payload     | 负载      | 请求体数据                |
| Header      | 头部      | HTTP 头                   |
| Status Code | 状态码    | HTTP 状态码               |
| CRUD        | 增删改查  | Create/Read/Update/Delete |
| List        | 列表      | 获取多条记录              |
| Get One     | 获取单条  | 获取单条记录              |
| Create      | 创建      | 新建记录                  |
| Update      | 更新      | 修改记录                  |
| Delete      | 删除      | 删除记录                  |

## Authentication Terms

| English            | Chinese      | Notes          |
| ------------------ | ------------ | -------------- |
| Sign Up / Register | 注册         | 新用户注册     |
| Sign In / Login    | 登录         | 用户登录       |
| Sign Out / Logout  | 登出         | 退出登录       |
| Email Verification | 邮箱验证     | 验证邮箱       |
| Password Reset     | 密码重置     | 找回密码       |
| OAuth Provider     | OAuth 提供商 | 第三方登录     |
| Auth Store         | 认证存储     | Token 存储方式 |
| Session            | 会话         | 用户会话       |
| Refresh Token      | 刷新令牌     | Token 刷新     |

## Development Terms

| English         | Chinese           | Notes                    |
| --------------- | ----------------- | ------------------------ |
| SDK             | SDK               | Software Development Kit |
| Extension       | 扩展              | 功能扩展                 |
| Plugin          | 插件              | 可插拔组件               |
| Go Template     | Go 模板           | 服务端模板               |
| JavaScript VM   | JavaScript 虚拟机 | JS 运行环境              |
| Docker          | Docker            | 容器技术                 |
| Deployment      | 部署              | 生产部署                 |
| Reverse Proxy   | 反向代理          | Nginx 等                 |
| SSL Certificate | SSL 证书          | HTTPS 证书               |

## Operation Terms

| English              | Chinese  | Notes       |
| -------------------- | -------- | ----------- |
| Instance             | 实例     | 服务器实例  |
| Container            | 容器     | Docker 容器 |
| Image                | 镜像     | Docker 镜像 |
| Volume               | 卷       | 数据卷      |
| Port                 | 端口     | 网络端口    |
| Environment Variable | 环境变量 | 配置变量    |
| Log                  | 日志     | 运行日志    |
| Backup               | 备份     | 数据备份    |
| Restore              | 恢复     | 数据恢复    |

## Error Messages

| English          | Chinese    | Notes        |
| ---------------- | ---------- | ------------ |
| Unauthorized     | 未授权     | 需要登录     |
| Forbidden        | 禁止访问   | 权限不足     |
| Not Found        | 未找到     | 资源不存在   |
| Validation Error | 验证错误   | 数据验证失败 |
| Duplicate Entry  | 重复条目   | 唯一性冲突   |
| Rate Limited     | 请求受限   | 超出频率限制 |
| Server Error     | 服务器错误 | 500 错误     |

## Code Conventions

### Keep in English

- Package names: `pocketbase`, `vue`, `react`
- Function names: `getList()`, `create()`, `authWithPassword()`
- API paths: `/api/collections/...`
- Property names: `collection`, `record`, `authStore`
- Error codes: `400`, `404`, `500`

### Translate to Chinese

- UI labels and messages
- Explanatory text
- Comments (unless code examples)
- Section headers and descriptions

### Mixed Format

- "使用 `pb.collection()` 方法..." (English code, Chinese explanation)
- "在 Auth Rules 中配置..." (English term, Chinese sentence)

## Translation Best Practices

1. **Technical Accuracy**: Maintain precise technical meaning
2. **Natural Chinese**: Use idiomatic Chinese, not literal translation
3. **Consistency**: Use the same translation for the same term throughout
4. **Code Examples**: Keep code examples in English, add Chinese comments
5. **UI Text**: Follow Chinese UI conventions (e.g., "登录" not "登入")
6. **Brand Names**: Keep product names in original (PocketBase, Docker, etc.)

## Common Patterns

| Pattern           | Chinese                  |
| ----------------- | ------------------------ |
| "How to X"        | "如何 X" 或 "X 的方法"   |
| "X with Y"        | "使用 Y 进行 X"          |
| "Getting Started" | "快速开始" 或 "入门指南" |
| "Best Practices"  | "最佳实践"               |
| "Troubleshooting" | "故障排查" 或 "常见问题" |
| "Step by step"    | "逐步" 或 "分步"         |

## Platform-Specific Terms

| English        | Chinese         |
| -------------- | --------------- |
| Docker Compose | Docker Compose  |
| Nginx          | Nginx           |
| Systemd        | Systemd         |
| Cron Job       | 定时任务        |
| Firewall       | 防火墙          |
| Security Group | 安全组 (阿里云) |
| OSS            | 对象存储        |
| CDN            | CDN             |
| SSL / TLS      | SSL / TLS       |

## Framework-Specific Terms

| English         | Chinese    | Context      |
| --------------- | ---------- | ------------ |
| Composition API | 组合式 API | Vue 3        |
| Composable      | 组合式函数 | Vue 3        |
| Pinia           | Pinia      | Vue 状态管理 |
| Hook            | Hook       | React        |
| useState        | useState   | React        |
| useEffect       | useEffect  | React        |
| UniApp          | UniApp     | 跨平台框架   |

## Updates

When adding new terms, update this document following the table format above.

Last updated: 2026-01-02
