# 汽修人员推荐调度系统

面向**重卡维修**的人员推荐与实时调度系统。

- 师傅端：企业微信 H5，扫码填档案、切换空闲/工作中、接派单、收通知
- 管理端：电脑浏览器调度后台，实时大屏、师傅档案、按擅长部位智能推荐 + 一键派单
- 运行：全部部署在阿里云 ECS，24 小时运行；本地电脑无需常驻服务

## 技术栈

| 层 | 技术 |
|----|------|
| 后端 | NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL |
| 缓存/定时 | Redis |
| 实时 | Socket.IO |
| 电脑后台 | React + Vite + Ant Design + ECharts |
| 移动端 | React + Vite + react-vant |
| 部署 | Docker Compose + Nginx（阿里云 ECS） |

## 目录结构

```
.
├── apps/
│   ├── api/        # NestJS 后端 API + WebSocket
│   ├── admin/      # 电脑调度后台 (React)
│   └── mobile/     # 企业微信 H5 (React)
├── docker/         # Docker Compose + Nginx 配置
├── .env.example    # 环境变量模板（复制为 .env 使用，勿提交真实密钥）
└── README.md
```

## 本地开发

> 需要 Node.js 18+、pnpm 或 npm、Docker Desktop。

### 1. 安装依赖

```bash
# 后端
cd apps/api && npm install

# 电脑后台
cd apps/admin && npm install

# 移动端
cd apps/mobile && npm install
```

### 2. 启动数据库（Docker）

```bash
cd docker
docker compose up -d postgres redis
```

### 3. 初始化数据库

```bash
cd apps/api
cp ../../.env.example .env   # 按需修改
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. 启动各端（开发模式）

```bash
# 后端 http://localhost:3000
cd apps/api && npm run start:dev

# 电脑后台 http://localhost:5173
cd apps/admin && npm run dev

# 移动端 http://localhost:5174
cd apps/mobile && npm run dev
```

默认管理员账号（seed 生成）：`admin` / `admin123`（首次登录后请修改）。

## 部署（阿里云 ECS）

见 [docker/README.md](docker/README.md) 与计划文档。核心流程：

1. ECS（2核4G）+ 安全组开放 80/443
2. 域名备案 + 解析 `admin.` / `m.` / `api.` 三个子域名
3. 服务器安装 Docker，`docker compose -f docker/docker-compose.yml up -d`
4. 配置 HTTPS 证书
5. 企业微信自建应用配置可信域名

## 业务要点

- **重卡品牌**：欧曼、解放、东风天龙、豪沃、汕德卡、陕汽德龙等；新能源重卡：**深向**、**零一**；电池品牌：**宁德时代**
- **维修部位**：发动机、变速箱、制动、电气、转向、液压、车桥悬挂、车身、后处理，以及**三电/新能源系统（含宁德时代电池）**
- **智能推荐**：擅长部位匹配 + 空闲状态 + 接单量均衡
- **自动状态**：工作中满 5 小时自动转回空闲
