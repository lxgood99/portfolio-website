# 个人作品集网站项目

## 项目概述

基于 Next.js 的全栈个人作品集网站，包含前端展示页面和管理后台。支持简历信息展示、作品集管理（PDF/图片/视频）、拖拽排序、自我评价、模块排序等功能。

### 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Storage**: S3 兼容对象存储
- **DnD**: @dnd-kit (拖拽功能)

## 目录结构

```
├── public/                 # 静态资源
├── scripts/                # 构建与启动脚本
│   ├── build.sh            # 构建脚本
│   ├── dev.sh              # 开发环境启动脚本
│   ├── prepare.sh          # 预处理脚本
│   └── start.sh            # 生产环境启动脚本
├── src/
│   ├── app/                # 页面路由与布局
│   │   ├── page.tsx        # 首页（展示页面）
│   │   ├── api/            # API 路由
│   │   │   ├── auth/       # 认证相关
│   │   │   ├── profile/    # 个人信息
│   │   │   ├── self-introduction/  # 自我评价
│   │   │   ├── work-experiences/    # 工作经历
│   │   │   ├── educations/          # 教育背景
│   │   │   ├── skills/              # 技能
│   │   │   ├── works/               # 作品集
│   │   │   ├── module-orders/       # 模块排序
│   │   │   ├── visit-stats/         # 访问统计
│   │   │   ├── contact-info/        # 联系方式
│   │   │   └── upload/              # 文件上传
│   │   └── admin/         # 管理后台页面
│   │       ├── profile/             # 个人信息
│   │       ├── self-introduction/   # 自我评价
│   │       ├── experience/          # 工作经历
│   │       ├── education/           # 教育背景
│   │       ├── skills/              # 技能
│   │       ├── works/               # 作品集
│   │       ├── contact/             # 联系方式
│   │       ├── module-orders/       # 模块排序
│   │       └── analytics/           # 数据统计
│   ├── components/ui/      # Shadcn UI 组件库
│   ├── hooks/              # 自定义 Hooks
│   │   └── useAdminAuth.ts # 管理员认证 Hook
│   ├── lib/                # 工具库
│   │   └── utils.ts        # 通用工具函数 (cn)
│   └── storage/            # 存储相关
│       └── database/       # 数据库配置
├── next.config.ts          # Next.js 配置
├── package.json            # 项目依赖管理
└── tsconfig.json           # TypeScript 配置
```

## 核心功能

### 前端展示
- 个人信息展示（头像、姓名、职位、联系方式、社交链接）
- 自我评价模块
- 工作经历（支持图片展示：横排/轮播模式）
- 教育背景
- 技能特长（进度条展示）
- 作品集（PDF/图片/视频，支持轮播展示、PDF内嵌预览、图片放大、视频内嵌播放）
- 联系方式模块（邮箱、电话、微信二维码、一键复制）
- 模块动态排序

### 管理后台
- 登录认证（Cookie + localStorage 双重机制）
- 个人信息管理
- 自我评价编辑（支持开关显示）
- 工作经历管理（拖拽排序、图片上传）
- 教育背景管理（拖拽排序）
- 技能管理
- 作品集管理（多文件上传、轮播模式）
- 联系方式管理（邮箱、电话、微信二维码、开关显示）
- 成长规划管理（甘特图时间线、拖拽调整、断点设置）
- 模块排序设置（全局拖拽排序、显示控制）
- 数据统计（访问量统计，仅后台可见）
- 开发日志（项目历程记录，仅后台可见）

## 数据库表结构

### profiles - 个人信息
- id, name, title, bio, avatar_key, email, phone, location, website, social_links

### self_introduction - 自我评价
- id, content, is_visible

### work_experiences - 工作经历
- id, company, position, description, start_date, end_date, location, image_display_mode, order

### work_experience_images - 工作经历图片
- id, work_experience_id, file_key, title, order

### educations - 教育背景
- id, school, degree, field, description, start_date, end_date, order

### skills - 技能
- id, name, level, category

### works - 作品
- id, title, description, category, tags, cover_image_key, display_mode, order

### work_items - 作品文件项
- id, work_id, type, file_key, title, is_carousel_item, order

### module_orders - 模块排序
- id, module_name, order, is_visible

### visit_stats - 访问统计
- id, total_visits, today_visits, last_visit_at, today_date

### contact_info - 联系方式
- id, email, phone, wechat_qr_key, wechat_id, is_visible, show_email, show_phone, show_wechat

### dev_logs - 开发日志
- id, version, title, created_at, requirements, completed_features, bug_fixes, notes, order_index

### timeline_items - 成长规划时间线
- id, name, start_year, start_month, end_year, end_month, color, breaks (JSONB), order

## 包管理规范

**仅允许使用 pnpm** 作为包管理器，**严禁使用 npm 或 yarn**。

**常用命令**：
- 安装依赖：`pnpm add <package>`
- 安装开发依赖：`pnpm add -D <package>`
- 安装所有依赖：`pnpm install`
- 移除依赖：`pnpm remove <package>`

## 开发规范

- **Hydration 错误预防**：严禁在 JSX 渲染逻辑中直接使用 typeof window、Date.now()、Math.random() 等动态数据。必须使用 'use client' 并配合 useEffect + useState 确保动态内容仅在客户端挂载后渲染；同时严禁非法 HTML 嵌套（如 <p> 嵌套 <div>）。
- **编码规范**：Airbnb

## UI 设计与组件规范

- 项目预装 `shadcn/ui` 组件库，位于 `src/components/ui/` 目录
- 必须默认采用 shadcn/ui 组件、风格和规范

## 管理员账户

- 用户名：`Lxgood`
- 密码：`LIUXINgood`

## 认证机制

采用 Cookie + localStorage 双重认证机制，解决沙箱环境 Cookie 同步问题：
- 登录成功后设置 Cookie 和 localStorage
- 使用 `window.location.href` 进行完整页面刷新，确保认证状态正确同步
- 所有管理后台页面使用统一的 `useAdminAuth` Hook 进行认证检查
