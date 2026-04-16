#!/bin/bash
set -e

echo "=================================="
echo "  个人作品集网站 - 部署脚本"
echo "=================================="

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "错误: 需要安装 Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "错误: 需要 Node.js 20+，当前版本: $(node -v)"
    exit 1
fi

echo "✓ Node.js 版本检查通过: $(node -v)"

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "警告: .env 文件不存在，正在从 .env.example 创建..."
    cp .env.example .env
    echo "请编辑 .env 文件填写数据库和存储配置"
fi

# 安装依赖
echo "安装依赖..."
npm install --prefer-offline

# 启动服务
echo "启动服务..."
npm start
