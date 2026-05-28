# 设计系统参考

以下规范确保生成的原型具有现代感。

## 1. 配色系统

**核心原则：去掉渐变，纯白背景 + 单色点缀**

| 页面类型 | 主色（点缀） | 色值 | 使用场景 |
|----------|-------------|------|----------|
| 社交/内容 | 活力橙 | `#FF6B35` | 强调按钮、选中态 |
| 工具/服务 | 清新绿 | `#00B578` | 成功状态、主按钮 |
| 专业/商务 | 深邃蓝 | `#2563EB` | 链接、主按钮 |
| 电商/活动 | 热情红 | `#EF4444` | 促销、警示 |
| 通用/默认 | 优雅紫 | `#7C3AED` | 品牌色、标签 |

**背景色规范**：
```css
--bg-page: #FFFFFF;           /* 页面背景 - 纯白 */
--bg-card: #FFFFFF;           /* 卡片背景 - 纯白 */
--bg-elevated: #F9FAFB;       /* 悬浮背景 - 极浅灰 */
```

**中性色系统**：
```css
--text-primary: #1F2937;      /* 主要文字 - 深灰 */
--text-secondary: #6B7280;    /* 次要文字 - 中灰 */
--text-tertiary: #9CA3AF;     /* 辅助文字 - 浅灰 */
--border-light: #E5E7EB;      /* 边框 - 浅灰 */
--icon-default: #9CA3AF;      /* 默认图标色 */
```

**避免使用的颜色**：
- ❌ 任何渐变色背景（`linear-gradient`）- 统一用纯色
- ❌ `#1890FF` - 过于普通的企业蓝
- ❌ 纯黑色 `#000000` - 使用深灰代替

## 2. 圆角系统

| 元素 | 圆角值 | 说明 |
|------|--------|------|
| 卡片 | `12px` | 统一大圆角，显现代感 |
| 按钮 | `10px` | 大圆角，非全圆 |
| 输入框 | `10px` | 与按钮保持一致 |
| 头像 | `50%`（圆形） | 人物头像必须圆形 |
| 图片 | `12px` | 与卡片协调 |
| 标签/徽章 | `6px` | 小圆角但不过尖 |
| 弹窗 | `16px` | 更大圆角突出层级 |

**避免**：`4px` 小圆角（显老旧）、`9999px` 胶囊形

## 3. 字体排版

| 层级 | 字号 | 字重 | 用途 |
|------|------|------|------|
| 大标题 | `28px` | 700 | 页面主标题、品牌名 |
| 导航标题 | `17px` | 600 | 导航栏标题 |
| 卡片标题 | `17px` | 600 | 卡片标题、区块标题 |
| 正文内容 | `15px` | 400 | 描述文字、列表内容 |
| 辅助信息 | `13px` | 400 | 时间、说明、提示 |
| 标签文字 | `12px` | 500 | 标签、徽章、小按钮 |

**行高规范**：
- 标题：`line-height: 1.3`
- 正文：`line-height: 1.6`
- 多行文本：`line-height: 1.7`

## 4. 间距系统

**8px 基准网格，增加留白**：

| 间距名称 | 值 | 用途 |
|----------|-----|------|
| xs | `8px` | 图标与文字间距 |
| sm | `12px` | 紧凑元素间距 |
| md | `16px` | 卡片内部 padding |
| lg | `20px` | 卡片之间间距 |
| xl | `24px` | 区块间距 |
| xxl | `32px` | 大区块分隔 |

**卡片规范**：
```css
.card {
    padding: 20px;
    margin-bottom: 16px;
    border-radius: 12px;
    background: #fff;
}
```

**页面边距**：
```css
.page-content {
    padding: 24px;
}
```

## 5. 阴影规范（更克制）

| 层级 | 阴影值 | 用途 |
|------|--------|------|
| 无阴影 | - | 默认卡片、列表（扁平化） |
| 轻微 | `0 2px 8px rgba(0,0,0,0.04)` | 悬浮卡片 |
| 适度 | `0 4px 16px rgba(0,0,0,0.06)` | 弹窗、下拉菜单 |
| 明显 | `0 8px 32px rgba(0,0,0,0.08)` | 模态框、抽屉 |

**原则**：能用边框分隔就不用阴影，保持清爽。

## 6. 图标规范（SVG 线性图标）

**禁止使用 emoji**，统一使用 SVG 线性图标。

**图标风格**：
- 线性风格（outline）
- 描边粗细：`1.5px` 或 `2px`
- 描边颜色：`#9CA3AF`（默认）或主色（激活态）
- 尺寸：24px × 24px（标准）、20px × 20px（小）、28px × 28px（大）

## 7. Tab 导航规范（毛玻璃效果）

```css
.tab-container {
    display: flex;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.tab-item.active {
    color: #fff;
    background: #2563EB;
    font-weight: 500;
}
```

## 8. 按钮规范

```css
.btn {
    height: 48px;
    padding: 0 24px;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.btn-primary {
    background: #2563EB;
    color: #fff;
    border: none;
}

.btn-secondary {
    background: #F3F4F6;
    color: #1F2937;
    border: none;
}
```

**避免**：渐变按钮、全圆角胶囊形。

## 9. 头像规范

```css
.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #E5E7EB;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6B7280;
    font-weight: 500;
    font-size: 15px;
    overflow: hidden;
}
```

## 10. 图片占位规范

```css
.image-placeholder {
    background: #F3F4F6;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
}
```

**禁止**：渐变背景、文字占位、emoji。
