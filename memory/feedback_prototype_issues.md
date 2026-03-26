---
name: 原型设计输出反馈
description: 记录原型设计技能输出的常见问题及修复方案，确保后续输出符合标准文档要求
type: feedback
---

## 问题1：缺少标注

**问题描述**：生成的原型没有按照《原型设计标准文档》第13章要求添加标注区域。

**原因分析**：技能流程中虽然读取了标准文档，但在实际输出时遗漏了标注部分。

**标准要求**（来自第13章）：
- 标注背景色：`#FFFBE6`（浅黄色）
- 标注边框：1px dashed `#FFC53D`（虚线橙色边框）
- 标注格式：以 📌 注 开头，说明功能逻辑规则给开发人员参考

**修复方案**：
```html
<div class="annotation">
    <div class="annotation-title">📌 注</div>
    <div class="annotation-content">
        1. 字段校验规则...<br>
        2. 交互说明...
    </div>
</div>
```

---

## 问题2：渐变按钮编辑时变白看不清

**问题描述**：带有渐变背景色的按钮（如提交按钮）进入编辑状态时，背景变成白色，导致文字看不清。

**根本原因**：`.editable-text[contenteditable="true"]:focus` 样式设置了 `background: #fff`，这会覆盖渐变按钮的 `background: linear-gradient(...)`。

**标准解决方案**（来自第10条强制规范）：
- 渐变按钮编辑时必须保持背景色可见
- 使用白色内描边作为编辑态反馈，而不是改变背景色

**正确CSS**：
```css
/* 错误 - 导致背景变白 */
.editable-text[contenteditable="true"]:focus {
    background: #fff;  /* 这会覆盖渐变背景 */
}

/* 正确 - 保持渐变背景，使用内描边 */
.btn-primary[contenteditable="true"]:focus {
    background: linear-gradient(135deg, #00B578 0%, #00A86B 100%) !important;
    box-shadow: inset 0 0 0 2px #fff, 0 0 0 3px #00B578;
}
```

---

## 问题3：输入框placeholder无法编辑

**问题描述**：输入框内的灰色提示文字（placeholder）无法直接点击编辑。

**根本原因**：HTML `<input>` 元素的 `placeholder` 属性是浏览器原生行为，无法通过 `contenteditable` 编辑。

**标准解决方案**（来自第11条强制规范）：
- 禁止使用 input 的 placeholder 属性（无法编辑）
- 必须使用可编辑的提示元素覆盖在输入框内

**正确实现**：
```html
<!-- 错误 - placeholder无法编辑 -->
<input type="text" placeholder="请输入姓名">

<!-- 正确 - 使用可编辑的覆盖层 -->
<div class="input-wrapper">
    <input type="text" class="form-input">
    <div class="input-placeholder editable-text" contenteditable="true">请输入姓名</div>
</div>
```

```css
.input-wrapper {
    position: relative;
}
.input-placeholder {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    font-size: 14px;
    pointer-events: none;
}
```

---

## 自检清单（输出前必检）

- [ ] 是否包含标注区域（📌 注）说明功能逻辑
- [ ] 渐变按钮是否有专门的 `:focus` 样式保持背景可见
- [ ] 输入框提示文字是否使用可编辑元素而非 placeholder 属性
- [ ] 所有文案是否支持 `contenteditable` 编辑
- [ ] 页面高度是否自适应（无固定高度）
- [ ] 底部按钮是否使用相对定位（非 fixed）

---

## 相关文档

- 《原型设计标准文档》第10条：渐变按钮可编辑样式
- 《原型设计标准文档》第11条：输入框提示文字可编辑实现
- 《原型设计标准文档》第13章：标注规范
