# 阿里云 ECS 部署指南

本目录用 Docker Compose 一键部署整套系统（后端 API、PostgreSQL、Redis、电脑后台、移动端 H5、Nginx 网关）。上线后全部在阿里云 ECS 24 小时运行，本地电脑无需运行任何服务。

## 一、准备阿里云资源

1. ECS 云服务器：推荐 2 核 4G，Ubuntu 22.04 或 Alibaba Cloud Linux。
2. 安全组：放行 80、443（临时 22 用于 SSH）。
3. 域名：完成实名备案（国内服务器必须，约 1-2 周）。
4. 解析三条 A 记录到 ECS 公网 IP：admin.你的域名、m.你的域名、api.你的域名。

## 二、安装 Docker

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
```

## 三、拉取代码并配置

```bash
git clone https://github.com/lw9335/-ooo.git qixiu
cd qixiu/docker
cp .env.example .env
vi .env
```

## 四、修改网关域名

编辑 docker/nginx/gateway.conf，把 example.com 换成你的真实子域名。

## 五、一键启动

```bash
bash deploy.sh
docker compose exec api npx prisma db seed
```

默认管理员 admin / admin123，登录后请立即改密码。

## 六、HTTPS

备案通过后签发证书放到 docker/nginx/certs/，打开 gateway.conf 的 443 段并重启网关。

## 七、企业微信

创建自建应用，拿到 CorpId/AgentId/Secret 填进 .env，可信域名填 m.你的域名。
