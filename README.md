# CocosCreator 粒子编辑器

一个面向 Cocos Creator 粒子资源的浏览器端编辑器，用于实时预览、调整并导出 `.plist` / `.png` 粒子配置资源。

项目基于 Vue 3、TypeScript、Vite 和 Naive UI 构建，核心预览使用 Canvas 实现。所有导入、预览和导出流程都在浏览器本地完成。

## 功能特性

- 实时粒子预览，支持拖动发射器、居中、重置和暂停播放。
- 支持 Cocos Creator 常用粒子参数编辑，包括生命周期、发射角度、发射区域、重力、速度、加速度、半径模式、颜色、透明度、粒子大小、自旋转和混合模式。
- 支持重力模式和半径模式切换。
- 支持导入 `.plist` 配置并回填到编辑器。
- 支持载入本地纹理图片，支持 PNG / JPG / WEBP。
- 支持拖拽纹理文件到纹理面板。
- 支持导出 `.plist`、导出纹理 PNG，以及一键导出 `.zip`。
- 使用 Naive UI 作为通用组件库，便于后续维护和扩展。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Naive UI
- lucide icons
- Canvas 2D

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认监听本地地址：

```text
http://127.0.0.1:5173/
```

如果该端口已被占用，Vite 会自动切换到下一个可用端口。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

本地预览生产构建：

```bash
npm run preview
```

## 使用说明

1. 打开编辑器后，可以直接基于默认烟花模板调整参数。
2. 在左侧预览区观察粒子效果，也可以拖动发射器位置。
3. 在右侧 Inspector 中调整粒子参数。
4. 在“粒子纹理”区域载入或拖入纹理图片。
5. 已有 Cocos Creator 粒子配置时，可以通过“导入 plist”读取配置。
6. 调整完成后，可以导出 `.plist`、导出 PNG，或导出包含两者的 `.zip`。

## 目录结构

```text
src/
├─ App.vue                     # 应用入口和粒子引擎编排
├─ main.ts                     # Vue 启动入口
├─ styles.css                  # 全局布局、主题和编辑器专用样式
├─ components/
│  ├─ StagePanel.vue           # 粒子预览画布和工具条
│  ├─ InspectorPanel.vue       # 参数编辑面板
│  ├─ InspectorSection.vue     # 折叠参数分组
│  └─ fields/                  # 可复用字段组件
└─ domain/
   ├─ particle-engine.ts       # Canvas 粒子模拟与渲染
   ├─ plist.ts                 # plist 导入导出
   ├─ presets.ts               # 默认模板和混合模式映射
   ├─ files.ts                 # 文件选择与拖拽处理
   ├─ download.ts              # 浏览器下载工具
   ├─ zip.ts                   # zip 打包
   └─ types.ts                 # 粒子状态和领域类型
```

## 说明

当前编辑器聚焦于 Cocos Creator 粒子资源的常用 `.plist` 字段，不等同于官方编辑器的完整替代品。若项目中存在自定义字段或特殊运行时逻辑，建议导入后再检查导出的配置是否符合项目需求。
