---
name: prototype-design-advanced
description: "高级原型设计编辑器。当用户说'高级原型'、'可编辑原型'、'原型编辑器'、'/prototype-advanced'时触发。生成支持完整编辑模式的原型：编辑开关、卡片复制/删除/拖拽/添加、快捷键、保存干净HTML。"
---

# 原型设计技能（高级版 - 完整编辑器）

## 触发词

- 高级原型
- 可编辑原型
- 原型编辑器
- 编辑模式原型
- /prototype-advanced

## 核心特性

本技能生成的原型是一个**完整的可视化编辑器**，支持：

1. **编辑模式开关** - 点击"进入编辑"开启/关闭编辑模式
2. **文案即时编辑** - 点击任意文字直接修改（contenteditable）
3. **卡片操作** - 复制📋、删除🗑️、拖拽排序、添加新卡片
4. **快捷键** - Ctrl+E 快速切换编辑模式
5. **保存导出** - 导出干净的HTML（移除所有编辑相关代码）

## 工作流程

### 1. 检查标准文档

使用 Glob 搜索 `*原型设计标准*.md` 或 `*原型标准*.md`：

- **如果找到标准文档**：读取并应用其中的设计规范
- **如果没有找到**：询问用户是否需要创建标准文档
  - 用户选择"是" → 引导创建标准文档
  - 用户选择"否" → 使用简约默认样式继续

### 2. 识别原型类型

从用户描述中判断原型类型：

- **移动端 App**：关键词如"app"、"移动端"、"手机"、"iOS"、"Android"
- **管理后台**：关键词如"后台"、"管理系统"、"PC端"、"web管理"
- **小程序**：关键词如"小程序"、"微信"、"支付宝"
- **其他**：如果无法判断，询问用户

### 3. 收集原型信息

快速询问用户：
- 页面名称（如"完工核销申请页"）
- 主要功能（简短描述即可）
- 是否有参考截图

### 4. 生成高级可编辑原型

**输出格式**：HTML 文件

**必须包含的编辑功能**：

#### 4.1 编辑模式切换

```html
<!-- 编辑控制栏 -->
<div class="editor-toolbar">
    <button id="editToggle" class="edit-toggle">
        <span class="edit-icon">✏️</span>
        <span class="edit-text">进入编辑</span>
    </button>
    <button id="saveBtn" class="save-btn" style="display: none;">
        <span>💾</span> 保存
    </button>
</div>
```

```css
.editor-toolbar {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    gap: 12px;
}

.edit-toggle, .save-btn {
    padding: 10px 20px;
    border-radius: 24px;
    border: none;
    background: linear-gradient(135deg, #00B578 0%, #00A86B 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 181, 120, 0.3);
    transition: all 0.3s;
}

.edit-toggle:hover, .save-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 181, 120, 0.4);
}

.edit-toggle.active {
    background: #FF3B30;
}
```

```javascript
// 编辑模式切换
let isEditMode = false;
const editToggle = document.getElementById('editToggle');
const saveBtn = document.getElementById('saveBtn');

editToggle.addEventListener('click', () => {
    isEditMode = !isEditMode;
    document.body.classList.toggle('edit-mode', isEditMode);
    editToggle.classList.toggle('active', isEditMode);
    editToggle.querySelector('.edit-text').textContent = isEditMode ? '退出编辑' : '进入编辑';
    saveBtn.style.display = isEditMode ? 'block' : 'none';
});

// 快捷键 Ctrl+E
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        editToggle.click();
    }
});
```

#### 4.2 卡片编辑功能

每个可编辑的卡片必须包含：

```html
<div class="card editable-card" data-card-id="1">
    <!-- 编辑工具栏（仅在编辑模式显示） -->
    <div class="card-toolbar">
        <button class="card-btn card-drag" title="拖拽排序">⋮⋮</button>
        <button class="card-btn card-copy" title="复制卡片">📋</button>
        <button class="card-btn card-delete" title="删除卡片">🗑️</button>
    </div>

    <!-- 卡片内容 -->
    <div class="card-content">
        <div class="editable-text" contenteditable="false">卡片内容</div>
    </div>
</div>

<!-- 添加卡片按钮（仅在编辑模式显示） -->
<button class="add-card-btn" style="display: none;">
    <span>+</span> 添加卡片
</button>
```

```css
/* 卡片编辑工具栏 */
.card-toolbar {
    position: absolute;
    top: -36px;
    right: 0;
    display: none;
    gap: 8px;
    padding: 6px 12px;
    background: #333;
    border-radius: 8px;
}

.edit-mode .editable-card:hover .card-toolbar {
    display: flex;
}

.card-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: rgba(255,255,255,0.1);
    color: #fff;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.card-btn:hover {
    background: rgba(255,255,255,0.25);
    transform: scale(1.1);
}

.card-drag {
    cursor: move;
}

/* 编辑模式下的卡片样式 */
.edit-mode .editable-card {
    position: relative;
    border: 2px dashed transparent;
    transition: all 0.2s;
}

.edit-mode .editable-card:hover {
    border-color: #00B578;
    box-shadow: 0 4px 20px rgba(0, 181, 120, 0.15);
}

/* 添加卡片按钮 */
.add-card-btn {
    width: 100%;
    padding: 20px;
    border: 2px dashed #ccc;
    border-radius: 12px;
    background: transparent;
    color: #999;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.3s;
}

.edit-mode .add-card-btn {
    display: block !important;
}

.add-card-btn:hover {
    border-color: #00B578;
    color: #00B578;
    background: rgba(0, 181, 120, 0.05);
}

/* 可编辑文字 */
.editable-text {
    transition: all 0.2s;
}

.edit-mode .editable-text {
    cursor: text;
    border-radius: 4px;
}

.edit-mode .editable-text:hover {
    background: rgba(0, 181, 120, 0.08);
}

.edit-mode .editable-text:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px #00B578;
    background: #fff;
}

/* 拖拽时的样式 */
.editable-card.dragging {
    opacity: 0.5;
    transform: scale(0.98);
}

.editable-card.drag-over {
    border-top: 3px solid #00B578;
}
```

```javascript
// 卡片操作功能
class CardEditor {
    constructor(container) {
        this.container = container;
        this.cards = container.querySelectorAll('.editable-card');
        this.init();
    }

    init() {
        // 复制卡片
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.card-copy')) {
                const card = e.target.closest('.editable-card');
                this.copyCard(card);
            }
        });

        // 删除卡片
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.card-delete')) {
                const card = e.target.closest('.editable-card');
                this.deleteCard(card);
            }
        });

        // 添加卡片
        const addBtn = this.container.querySelector('.add-card-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addCard());
        }

        // 初始化拖拽
        this.initDragAndDrop();

        // 启用/禁用 contenteditable
        this.toggleContentEditable(false);
    }

    copyCard(card) {
        const clone = card.cloneNode(true);
        clone.dataset.cardId = Date.now();
        card.after(clone);
        this.showToast('卡片已复制');
    }

    deleteCard(card) {
        if (confirm('确定要删除这个卡片吗？')) {
            card.remove();
            this.showToast('卡片已删除');
        }
    }

    addCard() {
        const template = this.container.querySelector('.editable-card');
        if (template) {
            const newCard = template.cloneNode(true);
            newCard.dataset.cardId = Date.now();
            newCard.querySelector('.editable-text').textContent = '新卡片内容';
            this.container.appendChild(newCard);
            this.showToast('新卡片已添加');
        }
    }

    initDragAndDrop() {
        let draggedCard = null;

        this.container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('editable-card')) {
                draggedCard = e.target;
                e.target.classList.add('dragging');
            }
        });

        this.container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('editable-card')) {
                e.target.classList.remove('dragging');
            }
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterCard = this.getDragAfterCard(this.container, e.clientY);
            if (afterCard) {
                this.container.insertBefore(draggedCard, afterCard);
            } else {
                this.container.appendChild(draggedCard);
            }
        });
    }

    getDragAfterCard(container, y) {
        const cards = [...container.querySelectorAll('.editable-card:not(.dragging)')];
        return cards.reduce((closest, card) => {
            const box = card.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset, element: card };
            }
            return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    toggleContentEditable(enable) {
        const texts = this.container.querySelectorAll('.editable-text');
        texts.forEach(text => {
            text.contentEditable = enable;
        });

        const cards = this.container.querySelectorAll('.editable-card');
        cards.forEach(card => {
            card.draggable = enable;
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'editor-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    const editors = document.querySelectorAll('.card-editor-container');
    editors.forEach(container => new CardEditor(container));
});
```

#### 4.3 保存干净HTML

```javascript
// 保存功能
saveBtn.addEventListener('click', () => {
    // 克隆当前文档
    const clone = document.documentElement.cloneNode(true);

    // 移除编辑相关元素
    const elementsToRemove = [
        '.editor-toolbar',
        '.card-toolbar',
        '.add-card-btn',
        '.editor-toast'
    ];

    elementsToRemove.forEach(selector => {
        clone.querySelectorAll(selector).forEach(el => el.remove());
    });

    // 移除编辑相关样式类
    clone.querySelectorAll('.edit-mode').forEach(el => {
        el.classList.remove('edit-mode');
    });

    // 移除可编辑属性
    clone.querySelectorAll('[contenteditable]').forEach(el => {
        el.removeAttribute('contenteditable');
    });

    // 移除拖拽属性
    clone.querySelectorAll('[draggable]').forEach(el => {
        el.removeAttribute('draggable');
    });

    // 移除编辑相关CSS
    const styles = clone.querySelectorAll('style');
    styles.forEach(style => {
        style.textContent = style.textContent.replace(/\.edit-mode[^{]*\{[^}]*\}/g, '');
        style.textContent = style.textContent.replace(/\.card-toolbar[^{]*\{[^}]*\}/g, '');
    });

    // 移除编辑相关JS
    const scripts = clone.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.textContent.includes('CardEditor') ||
            script.textContent.includes('isEditMode')) {
            script.remove();
        }
    });

    // 生成干净的HTML
    const cleanHTML = '<!DOCTYPE html>\n' + clone.outerHTML;

    // 下载文件
    const blob = new Blob([cleanHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '原型设计_干净版.html';
    a.click();
    URL.revokeObjectURL(url);

    showToast('已保存干净HTML');
});
```

## 基础规范继承

本技能继承 `prototype-design` 的所有基础规范，包括：

- 高度自适应原则
- 状态栏与导航栏规范
- 最小页面高度规范
- 多页面并排布局规范
- 弹窗显示规范
- 页面内容组织规范
- 标注规范
- 胶囊形按钮样式
- 输入框提示文字的可编辑实现

## 输出前检查清单

- [ ] 包含编辑模式切换按钮（右上角固定）
- [ ] 支持 Ctrl+E 快捷键
- [ ] 卡片可复制、删除、拖拽排序
- [ ] 可添加新卡片
- [ ] 文案点击可编辑
- [ ] 保存按钮可导出干净HTML
- [ ] 退出编辑模式后所有编辑控件隐藏
- [ ] 干净的HTML中不包含任何编辑相关代码

## 默认样式

- 编辑工具栏：固定右上角，渐变绿色背景
- 卡片工具栏：黑色背景，悬浮显示
- 编辑模式边框：绿色虚线边框
- 可编辑文字：hover 浅绿背景，focus 绿色描边
- Toast 提示：底部居中，黑色背景

## 输出位置

- 如果项目有 `功能规划/` 目录 → 输出到该目录
- 否则 → 输出到当前工作目录
- 文件名：`[功能名]原型设计_可编辑版.html`

## 注意事项

1. **编辑模式默认关闭** - 用户需要点击"进入编辑"才能编辑
2. **保存的是副本** - 原始文件保留编辑功能
3. **卡片必须有 data-card-id** - 用于区分不同卡片
4. **拖拽使用 HTML5 API** - 确保浏览器兼容性
5. **快捷键只在非输入状态生效** - 避免与输入冲突
