---
name: prototype-design-guided
description: "引导式原型设计。当用户说'怎么做原型'、'详细原型设计'、'引导我做原型'或 /prototype-guided 时触发。逐步引导用户完成原型设计，适合复杂页面或首次使用。"
---

# 原型设计技能（引导版）

## 触发词

- 怎么做原型
- 详细原型设计
- 引导我做原型
- 原型设计引导
- /prototype-guided

## 工作流程

### 第1步：检查标准文档

使用 Glob 搜索 `*原型设计标准*.md` 或 `*原型标准*.md`：

- **如果找到标准文档**：读取并应用其中的设计规范
- **如果没有找到**：询问用户是否需要创建标准文档
  - 用户选择"是" → 引导创建标准文档
  - 用户选择"否" → 使用简约默认样式继续

### 第2步：确认原型类型

询问用户选择原型类型：
- 移动端 App（iOS/Android）
- 管理后台（PC Web）
- 小程序（微信/支付宝）
- H5 页面
- 其他（用户自定义）

### 第3步：收集页面信息

逐项询问用户：

1. **页面名称**：如"完工核销申请页"
2. **页面用途**：简述页面的主要功能
3. **用户角色**：谁会使用这个页面
4. **页面类型**：
   - 表单填写页
   - 信息展示页
   - 列表浏览页
   - 详情查看页
   - 其他

### 第4步：收集功能模块

引导用户描述页面包含的功能模块：

1. **顶部区域**：导航栏、状态卡片、筛选条件等
2. **主体内容**：表单、列表、卡片、详情信息等
3. **底部区域**：操作按钮、提示信息等
4. **弹窗/抽屉**：是否有弹窗或侧边栏

每个模块询问：
- 模块名称
- 包含的字段/元素
- 交互行为

### 第5步：确认样式风格

如果有标准文档，直接应用；如果没有，询问用户：

1. **主色调**：品牌色或主题色
2. **圆角风格**：直角/小圆角/大圆角
3. **按钮样式**：扁平/渐变/立体
4. **整体风格**：简约/商务/活泼

### 第6步：生成原型

**输出格式**：HTML 文件

**HTML 原型规范**（强制，基于原型设计标准文档第15章）：

#### 页面容器规范

1. **高度自适应原则**
   - 手机框架 `.phone-frame` 必须使用 `height: auto`，**禁止**设置固定高度
   - 手机屏幕 `.phone-screen` 必须使用 `height: auto`，根据内容自然撑开
   - **禁止**使用 `<div style="height: 100px;"></div>` 等占位元素撑开页面高度
   - **禁止**添加刘海装饰元素（如 `.phone-notch`）
   - 底部操作区使用 flex 布局，紧贴内容底部

2. **状态栏与导航栏规范**
   - 状态栏必须与导航栏使用相同的渐变色，保持视觉统一
   - 状态栏高度44px，仅显示时间（左侧）
   - **禁止**显示WiFi、电量等系统图标，保持简洁
   - 导航栏高度44px
   - **禁止**状态栏与导航栏使用不同颜色

3. **最小页面高度规范**
   - 页面内容区设置最小高度 `min-height: 667px`
   - 当内容超过最小高度时，页面自动扩展

#### 多页面并排布局规范

4. **定位约束**
   - 底部操作按钮必须使用**相对定位**或 flex 布局
   - **禁止**使用 `position: fixed`，避免按钮重叠到其他页面
   - 弹窗遮罩层使用 `position: absolute` 而非 `position: fixed`

#### 弹窗显示规范

5. **默认隐藏原则**
   - 弹窗元素默认必须隐藏（`display: none`）
   - 通过 JavaScript 控制弹窗的显示/隐藏

#### 页面内容组织规范

6. **内容完整性**
   - 每个页面必须包含完整内容，**禁止**出现空白页面
   - 页面标题需清晰标识页面名称和状态

#### HTML原型可编辑规范

7. **半可编辑能力：文案可改 + 区块可拖动**
   - 页面标题、分组标题、字段文案、按钮文案、提示文案、标注文案均应支持编辑
   - 使用 `contenteditable="true"` 实现文案编辑
   - 编辑态需有视觉反馈：hover 高亮 `rgba(0, 181, 120, 0.08)`、focus 描边 `#00B578`
   - 主要功能模块（卡片、分组）支持拖动调整位置（HTML5 Drag and Drop API）
   - 拖动后位置可保存到 localStorage

#### 标注规范

8. **平台差异化的标注位置**
   - **移动端 App/小程序**：标注放置在页面右侧，避免遮挡主体内容
   - **管理后台/PC Web**：标注放置在页面左侧或右侧（根据页面内容位置决定）
   - **H5 页面**：标注放置在页面底部
   - 标注样式：浅黄背景 `#FFFBE6`，虚线橙边框 `#FFC53D`，圆角 4px
   - 标注与页面元素使用虚线连接，线色 `#FFC53D`，箭头指向被说明元素

9. **标注布局方式**（强制）
   - **必须使用 flex 横向排列**：`.page-wrapper { display: flex; gap: 12px; }`
   - **禁止使用 absolute 定位**：避免多页面并排时标注重叠或被遮挡
   - 手机框架和标注在同一行，标注紧跟手机右侧

#### 可编辑元素特殊处理

10. **渐变按钮的可编辑样式**（强制）
    - 渐变按钮编辑时必须保持背景色可见
    - 使用白色内描边作为编辑态反馈：
      ```css
      .btn-primary[contenteditable="true"]:focus {
          background: linear-gradient(135deg, #00B578 0%, #00A86B 100%) !important;
          box-shadow: inset 0 0 0 2px #fff, 0 0 0 3px #00B578;
      }
      ```
    - **禁止**使用默认的 focus 样式（会导致背景变白）

10.1 **按钮样式规范**（强制）
    - **必须使用胶囊形（圆角按钮）**：`border-radius: 高度 / 2`
    - 例如：高度 48px 的按钮，`border-radius: 24px`
    - **禁止**使用小圆角（如 4px、8px）或直角
    - 主按钮使用渐变背景，次按钮使用白色背景+绿色边框

11. **输入框提示文字的可编辑实现**（强制）
    - **禁止使用 input 的 placeholder 属性**（无法编辑）
    - **必须使用可编辑的提示元素覆盖在输入框内**：
      ```html
      <div class="input-wrapper">
          <input type="text" class="form-input">
          <div class="input-placeholder editable-text" contenteditable="true">请输入手机号</div>
      </div>
      ```
    - CSS 实现要点：
      ```css
      .input-wrapper {
          position: relative;
      }
      .form-input {
          width: 100%;
          height: 44px;
          padding: 0 12px;
          /* ...其他样式 */
      }
      .input-placeholder {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #999;
          font-size: 14px;
          pointer-events: none; /* 让点击穿透到 input */
      }
      /* 输入框有内容时隐藏 placeholder */
      .form-input:not(:placeholder-shown) + .input-placeholder,
      .form-input:focus + .input-placeholder {
          display: none;
      }
      ```
    - **效果**：灰色提示文字显示在输入框内，点击可直接编辑，输入内容后自动隐藏

#### 输出前检查清单

- [ ] 所有页面高度均为自适应，无固定高度
- [ ] 内容区设置了最小高度（min-height: 667px）
- [ ] 无占位元素（`<div style="height: XXpx;"></div>`）
- [ ] 无刘海装饰元素（`.phone-notch`）
- [ ] 状态栏与导航栏使用相同的渐变色
- [ ] 底部按钮使用相对定位，不重叠到其他页面
- [ ] 弹窗默认隐藏（`display: none`）
- [ ] 所有页面都有实际内容，无空白页面
- [ ] 页面中的核心静态文案支持直接编辑
- [ ] 可编辑区域具备明确的编辑态样式反馈

**参考代码片段**：

```css
/* 页面容器 */
.phone-frame {
    height: auto;
    display: flex;
    flex-direction: column;
}
.phone-screen {
    height: auto;
    display: flex;
    flex-direction: column;
}
.content {
    flex: 1;
    min-height: 667px;
}
.bottom-action {
    flex-shrink: 0;
}

/* 可编辑样式 */
.editable-text[contenteditable="true"]:hover {
    background: rgba(0, 181, 120, 0.08);
}
.editable-text[contenteditable="true"]:focus {
    outline: none;
    box-shadow: inset 0 0 0 1px #00B578;
    border-radius: 4px;
    background: #fff;
}

/* 标注样式 */
.annotation {
    background: #FFFBE6;
    border: 1px dashed #FFC53D;
    border-radius: 4px;
    padding: 12px;
}
```

### 第7步：确认与迭代

生成后询问用户：
- 是否需要调整样式
- 是否需要增加/删除模块
- 是否需要调整交互逻辑

## 输出位置

- 如果项目有 `功能规划/` 目录 → 输出到该目录
- 否则 → 输出到当前工作目录
- 文件名：`[功能名]原型设计.html`

## 注意事项

1. **逐步引导**：每个步骤等待用户确认后再进行下一步
2. **实时反馈**：每收集一个模块信息立即确认
3. **可回退**：用户可以随时返回修改之前的选择
4. **详细记录**：记录用户的所有选择，便于后续调整
