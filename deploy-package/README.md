# 个人作品集网站 - 服务器部署指南

## 部署要求

- Node.js 20+
- PostgreSQL 数据库
- S3 兼容对象存储（如火山引擎TOS）

## 一、服务器准备

### 1.1 创建火山引擎云服务器 (ECS)

1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入「云服务器 ECS」
3. 创建实例：
   - **地域**: 选择离您最近的地域
   - **规格**: 2核2G起步
   - **操作系统**: Ubuntu 22.04 / CentOS 8
   - **带宽**: 5Mbps起步

### 1.2 安装Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v  # 应显示 v20.x.x
npm -v
```

### 1.3 安装PostgreSQL

```bash
# Ubuntu
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 二、数据库配置

### 2.1 创建数据库

```bash
sudo -u postgres psql

# 在psql中执行:
CREATE DATABASE portfolio_db;
CREATE USER portfolio_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE portfolio_db TO portfolio_user;
\q
```

### 2.2 创建数据表

连接到数据库后执行以下SQL创建所有表：

```sql
-- 个人信息表
CREATE TABLE profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '刘鑫',
    title VARCHAR(255),
    bio TEXT,
    avatar_key VARCHAR(500),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    website VARCHAR(500),
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自我评价表
CREATE TABLE self_introduction (
    id SERIAL PRIMARY KEY,
    content TEXT,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 自我评价卡片表
CREATE TABLE self_intro_cards (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工作经历表
CREATE TABLE work_experiences (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255),
    position VARCHAR(255),
    description TEXT,
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    location VARCHAR(255),
    image_display_mode VARCHAR(50) DEFAULT 'carousel',
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工作经历图片表
CREATE TABLE work_experience_images (
    id SERIAL PRIMARY KEY,
    work_experience_id INTEGER REFERENCES work_experiences(id) ON DELETE CASCADE,
    file_key VARCHAR(500),
    title VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 教育背景表
CREATE TABLE educations (
    id SERIAL PRIMARY KEY,
    school VARCHAR(255),
    degree VARCHAR(100),
    field VARCHAR(255),
    description TEXT,
    start_date VARCHAR(50),
    end_date VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 技能表
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    level INTEGER DEFAULT 50,
    category VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作品分类表
CREATE TABLE work_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作品表
CREATE TABLE works (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES work_categories(id) ON DELETE SET NULL,
    title VARCHAR(255),
    description TEXT,
    tags TEXT,
    cover_image_key VARCHAR(500),
    display_mode VARCHAR(50) DEFAULT 'carousel',
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 作品文件项表
CREATE TABLE work_items (
    id SERIAL PRIMARY KEY,
    work_id INTEGER REFERENCES works(id) ON DELETE CASCADE,
    type VARCHAR(50),
    file_key VARCHAR(500),
    title VARCHAR(255),
    is_carousel_item BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 模块排序表
CREATE TABLE module_orders (
    id SERIAL PRIMARY KEY,
    module_name VARCHAR(100) UNIQUE NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 访问统计表
CREATE TABLE visit_stats (
    id SERIAL PRIMARY KEY,
    total_visits INTEGER DEFAULT 0,
    today_visits INTEGER DEFAULT 0,
    last_visit_at TIMESTAMP,
    today_date VARCHAR(20)
);

-- 联系方式表
CREATE TABLE contact_info (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    phone VARCHAR(50),
    wechat_qr_key VARCHAR(500),
    wechat_id VARCHAR(100),
    is_visible BOOLEAN DEFAULT true,
    show_email BOOLEAN DEFAULT true,
    show_phone BOOLEAN DEFAULT true,
    show_wechat BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 成长规划时间线表
CREATE TABLE timeline_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    start_year INTEGER,
    start_month INTEGER,
    end_year INTEGER,
    end_month INTEGER,
    color VARCHAR(50),
    breaks JSONB DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 开发日志表
CREATE TABLE dev_logs (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50),
    title VARCHAR(255),
    requirements TEXT,
    completed_features TEXT,
    bug_fixes TEXT,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员账户表
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化数据
INSERT INTO profiles (name, title, bio, location) VALUES 
('刘鑫', '综合岗 / 项目助理 / 新媒体运营', '一个热爱研究电脑技术与实用工具的探索者', '北京市·丰台区');

INSERT INTO self_introduction (content, is_visible) VALUES 
('一个爱研究工具、重逻辑、细节控的人。擅长拆解电脑软件与操作流程，快速上手各类实用工具；做事严谨闭环，偏爱整理、归纳这类能体现秩序感的事；能沉心专注，把时间花在真正解决问题上。', true);

INSERT INTO admin_users (username, password_hash) VALUES 
('Lxgood', '$2a$10$xxxxxxx'); -- 请使用实际bcrypt哈希值
```

## 三、对象存储配置

### 3.1 创建火山引擎TOS存储桶

1. 登录 [火山引擎控制台](https://console.volcengine.com/)
2. 进入「对象存储 TOS」
3. 创建存储桶：
   - **桶名称**: 如 `portfolio-works`
   - **地域**: 与ECS相同地域
   - **存储类型**: 标准存储
   - **访问权限**: 公有读

### 3.2 配置CORS（跨域）

在存储桶设置中配置CORS规则：
```xml
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration>
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>DELETE</AllowedMethod>
        <AllowedHeader>*</AllowedHeader>
        <ExposeHeader>ETag</ExposeHeader>
        <MaxAgeSeconds>3600</MaxAgeSeconds>
    </CORSRule>
</CORSConfiguration>
```

## 四、部署网站

### 4.1 上传文件到服务器

```bash
# 在本地打包
cd /workspace/projects
tar -czvf portfolio-deploy.tar.gz .next/ server.js package.json pnpm-lock.yaml .env.example deploy.sh ecosystem.config.js

# 上传到服务器 (使用scp或rsync)
scp portfolio-deploy.tar.gz user@your-server-ip:/home/user/portfolio/
```

### 4.2 在服务器上解压和配置

```bash
ssh user@your-server-ip

# 解压
cd /home/user/portfolio
tar -xzvf portfolio-deploy.tar.gz

# 创建环境变量文件
cp .env.example .env
nano .env  # 编辑填写实际配置

# 安装依赖
npm install

# 创建日志目录
mkdir -p logs
```

### 4.3 使用PM2启动

```bash
# 全局安装PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 save
pm2 startup
```

### 4.4 配置Nginx反向代理（可选但推荐）

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/portfolio
```

写入以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.5 配置SSL证书（可选但推荐）

使用Let's Encrypt免费证书：
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 五、验证部署

访问 `http://your-server-ip` 或 `https://your-domain.com` 检查网站是否正常运行。

管理后台地址: `/admin`
默认管理员: `Lxgood` / `LIUXINgood`

## 六、常见问题

### 6.1 数据库连接失败
- 检查 `.env` 中的 `DATABASE_URL` 是否正确
- 确认PostgreSQL服务正在运行
- 检查防火墙是否允许5432端口

### 6.2 文件上传失败
- 检查存储桶配置和CORS设置
- 确认IAM密钥权限正确
- 检查存储桶访问权限

### 6.3 端口被占用
```bash
# 查看5000端口占用
lsof -i:5000
# 或
ss -tlnp | grep 5000
```

### 6.4 PM2常用命令
```bash
pm2 status          # 查看状态
pm2 logs            # 查看日志
pm2 restart all     # 重启所有
pm2 stop all       # 停止所有
pm2 delete all     # 删除所有
```

## 七、联系方式

如有问题，请检查日志或联系技术支持。
