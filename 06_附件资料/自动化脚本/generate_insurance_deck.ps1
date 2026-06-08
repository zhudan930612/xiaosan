param(
    [string]$TemplatePath = "E:\个人资料\ppt模板.pptx",
    [string]$OutputPath = "E:\AI知识库\小型工程管理系统\06_附件资料\备案巡检资料\安责险对接沟通PPT_20260604.pptx"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function Cm([double]$value) {
    return [double]($value * 28.3464567)
}

function To-OleColor([string]$hex) {
    $clean = $hex.TrimStart("#")
    $color = [System.Drawing.ColorTranslator]::FromHtml("#$clean")
    return [System.Drawing.ColorTranslator]::ToOle($color)
}

function Find-ShapeById($collection, [int]$shapeId) {
    foreach ($shape in @($collection)) {
        if ($shape.Id -eq $shapeId) {
            return $shape
        }
        if ($shape.Type -eq 6) {
            $nested = Find-ShapeById $shape.GroupItems $shapeId
            if ($null -ne $nested) {
                return $nested
            }
        }
    }
    return $null
}

function Get-ShapeById($slide, [int]$shapeId) {
    $shape = Find-ShapeById $slide.Shapes $shapeId
    if ($null -ne $shape) {
        return $shape
    }
    throw "Slide $($slide.SlideIndex) 未找到 Id=$shapeId 的形状"
}

function Set-ShapeText($slide, [int]$shapeId, [string]$text, $fontSize = $null) {
    $shape = Get-ShapeById $slide $shapeId
    $shape.TextFrame.TextRange.Text = $text
    if ($null -ne $fontSize) {
        $shape.TextFrame.TextRange.Font.Size = [double]$fontSize
    }
    return $shape
}

function Get-FirstTableShape($slide) {
    foreach ($shape in @($slide.Shapes)) {
        if ($shape.HasTable -eq -1) {
            return $shape
        }
    }
    throw "Slide $($slide.SlideIndex) 未找到表格"
}

function Set-CellText($table, [int]$row, [int]$col, [string]$text, [double]$fontSize = 12, [bool]$bold = $false, [bool]$center = $false) {
    $cell = $table.Cell($row, $col)
    $range = $cell.Shape.TextFrame.TextRange
    $range.Text = $text
    $range.Font.Size = $fontSize
    $range.Font.Bold = $(if ($bold) { -1 } else { 0 })
    if ($center) {
        $range.ParagraphFormat.Alignment = 2
    } else {
        $range.ParagraphFormat.Alignment = 1
    }
}

function Add-Box($slide, [double]$left, [double]$top, [double]$width, [double]$height, [string]$text, [string]$fillHex, [string]$fontHex = "FFFFFF", [double]$fontSize = 14) {
    $shape = $slide.Shapes.AddShape(5, $left, $top, $width, $height)
    $shape.Fill.ForeColor.RGB = To-OleColor $fillHex
    $shape.Line.ForeColor.RGB = To-OleColor "D9E6E1"
    $shape.Line.Weight = 1.2
    $shape.TextFrame.TextRange.Text = $text
    $shape.TextFrame.TextRange.Font.Size = $fontSize
    $shape.TextFrame.TextRange.Font.Bold = -1
    $shape.TextFrame.TextRange.Font.Color.RGB = To-OleColor $fontHex
    $shape.TextFrame.TextRange.ParagraphFormat.Alignment = 2
    $shape.TextFrame.VerticalAnchor = 3
    $shape.TextFrame.MarginLeft = 10
    $shape.TextFrame.MarginRight = 10
    $shape.TextFrame.MarginTop = 8
    $shape.TextFrame.MarginBottom = 8
    return $shape
}

function Add-Arrow($slide, [double]$left, [double]$top, [double]$width, [double]$height) {
    $arrow = $slide.Shapes.AddShape(52, $left, $top, $width, $height)
    $arrow.Fill.ForeColor.RGB = To-OleColor "27A66D"
    $arrow.Line.Visible = 0
    return $arrow
}

function Add-NoteBox($slide, [double]$left, [double]$top, [double]$width, [double]$height, [string]$title, [string]$body, [string]$fillHex = "F3FAF6") {
    $shape = $slide.Shapes.AddShape(5, $left, $top, $width, $height)
    $shape.Fill.ForeColor.RGB = To-OleColor $fillHex
    $shape.Line.ForeColor.RGB = To-OleColor "CFE4D8"
    $shape.Line.Weight = 1
    $shape.TextFrame.TextRange.Text = "$title`n$body"
    $shape.TextFrame.TextRange.Font.Name = "Microsoft YaHei"
    $shape.TextFrame.TextRange.Font.Size = 11
    $shape.TextFrame.TextRange.Font.Color.RGB = To-OleColor "20323B"
    $shape.TextFrame.MarginLeft = 12
    $shape.TextFrame.MarginRight = 12
    $shape.TextFrame.MarginTop = 10
    $shape.TextFrame.MarginBottom = 10
    $shape.TextFrame.TextRange.Paragraphs(1).Font.Bold = -1
    $shape.TextFrame.TextRange.Paragraphs(1).Font.Size = 12
    return $shape
}

function Add-TitleText($slide, [double]$left, [double]$top, [double]$width, [double]$height, [string]$text, [double]$fontSize = 24, [string]$fontHex = "FFFFFF") {
    $shape = $slide.Shapes.AddTextbox(1, $left, $top, $width, $height)
    $shape.TextFrame.TextRange.Text = $text
    $shape.TextFrame.TextRange.Font.Name = "Microsoft YaHei"
    $shape.TextFrame.TextRange.Font.Size = $fontSize
    $shape.TextFrame.TextRange.Font.Bold = -1
    $shape.TextFrame.TextRange.Font.Color.RGB = To-OleColor $fontHex
    return $shape
}

if (!(Test-Path -LiteralPath $TemplatePath)) {
    throw "模板不存在：$TemplatePath"
}

$outputDir = Split-Path -Parent $OutputPath
if (!(Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

Copy-Item -LiteralPath $TemplatePath -Destination $OutputPath -Force

$page1 = "E:\AI知识库\小型工程管理系统\06_附件资料\备案巡检资料\线上投保原型_页面1.png"
$page2 = "E:\AI知识库\小型工程管理系统\06_附件资料\备案巡检资料\线上投保原型_页面2.png"
$page4 = "E:\AI知识库\小型工程管理系统\06_附件资料\备案巡检资料\线上投保原型_页面4.png"
$page5 = "E:\AI知识库\小型工程管理系统\06_附件资料\备案巡检资料\线上投保原型_页面5.png"

$ppt = $null
$presentation = $null

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    $ppt.Visible = -1
    $ppt.DisplayAlerts = 1

    $presentation = $ppt.Presentations.Open($OutputPath, 0, 0, 0)

    $slide1 = $presentation.Slides.Item(1)
    Set-ShapeText $slide1 9 "青浦区小型工程安责险对接方案" 28 | Out-Null
    Set-ShapeText $slide1 14 "面向保险公司联调沟通" 18 | Out-Null
    Set-ShapeText $slide1 3 "小型工程安全纳管平台 / 线上投保专项" 11 | Out-Null
    Set-ShapeText $slide1 10 "2026年06月04日" 22 | Out-Null

    $slide2 = $presentation.Slides.Item(2)
    Set-ShapeText $slide2 70 "投保流程图及流程说明" 24 | Out-Null

    $stepTop = Cm 4.2
    $stepLeft = Cm 2.3
    $stepWidth = Cm 4.1
    $stepHeight = Cm 2.3
    $gap = Cm 0.6
    $arrowWidth = Cm 0.8
    $fillColors = @("27A66D", "35AD73", "4FB3D7", "27A66D", "35AD73", "4FB3D7")
    $stepTexts = @(
        "1 平台展示`n保司入口",
        "2 用户授权`n并选择保司",
        "3 平台带参`n发起投保订单",
        "4 保司发送`n短信与链接",
        "5 用户在保司H5`n确认并支付",
        "6 保司回传结果`n平台关联备案"
    )

    for ($i = 0; $i -lt $stepTexts.Count; $i++) {
        $left = $stepLeft + $i * ($stepWidth + $gap + $arrowWidth)
        Add-Box $slide2 $left $stepTop $stepWidth $stepHeight $stepTexts[$i] $fillColors[$i] | Out-Null
        if ($i -lt $stepTexts.Count - 1) {
            $arrowLeft = $left + $stepWidth + (Cm 0.15)
            Add-Arrow $slide2 $arrowLeft ($stepTop + (Cm 0.55)) $arrowWidth (Cm 1.2) | Out-Null
        }
    }

    Add-NoteBox $slide2 (Cm 2.4) (Cm 8.0) (Cm 9.2) (Cm 3.0) "平台侧边界" "平台只承接入口、带参与结果关联，不在平台内承载交易支付页面。" | Out-Null
    Add-NoteBox $slide2 (Cm 12.1) (Cm 8.0) (Cm 9.2) (Cm 3.0) "回传最小字段集" "交易流水号、保单号、投保状态、拒保原因、电子保单 URL。" | Out-Null
    Add-NoteBox $slide2 (Cm 21.8) (Cm 8.0) (Cm 9.2) (Cm 3.0) "异常处理口径" "支付失败、超时未支付或短信未触达时，不自动关联保单，由平台保留待处理状态。" | Out-Null
    Add-NoteBox $slide2 (Cm 2.4) (Cm 11.5) (Cm 28.5) (Cm 2.2) "当前建议方案" "优先按 (授权确认 -> 选保司 -> 保司短信 -> 保司 H5 支付 -> 回传平台) 的闭环推进，便于快速对接首家保险公司。" "EEF6FF" | Out-Null

    $slide3 = $presentation.Slides.Item(3)
    Set-ShapeText $slide3 70 "平台与保险公司互传清单" 24 | Out-Null
    $table3 = (Get-FirstTableShape $slide3).Table
    Set-CellText $table3 1 1 "方向" 16 $true $true
    Set-CellText $table3 1 2 "阶段" 16 $true $true
    Set-CellText $table3 1 3 "字段或资料" 16 $true $true
    Set-CellText $table3 1 4 "说明/确认点" 16 $true $true

    Set-CellText $table3 2 1 "平台→保司" 12 $true $true
    Set-CellText $table3 2 2 "发起投保" 12 $true $true
    Set-CellText $table3 2 3 "投/被保险人名称`n统一社会信用代码`n备案人姓名/手机" 11 $false $false
    Set-CellText $table3 2 4 "来自备案平台基础资料，建议保司确认字段映射与数据类型口径。" 10 $false $false
    Set-CellText $table3 3 3 "工程名称、工程类型、工程地址、街镇`n施工内容、负责人、负责人手机`n工程造价、工程起止期" 10.5 $false $false
    Set-CellText $table3 3 4 "用于生成投保订单及保费试算；如保司允许修改，需明确哪些字段可改。" 10 $false $false
    Set-CellText $table3 4 3 "附件资料`n施工单位营业执照`n承发包合同" 11 $false $false
    Set-CellText $table3 4 4 "需保司确认附件传输方式：文件流 / URL / Base64 / 表单文件流。" 10 $false $false

    Set-CellText $table3 5 1 "保司→平台" 12 $true $true
    Set-CellText $table3 5 2 "结果回传" 12 $true $true
    Set-CellText $table3 5 3 "交易流水号、保单号、投保状态`n拒保原因、电子保单 URL" 11 $false $false
    Set-CellText $table3 5 4 "本期最小回传字段集；建议保司明确失败重试次数、鉴权方式和返回码规范。" 10 $false $false
    Set-CellText $table3 6 3 "投保成功短信`n电子保单/电子发票发送结果" 11 $false $false
    Set-CellText $table3 6 4 "便于平台提示备案方闭环状态，也方便后续客服排障。" 10 $false $false

    Set-CellText $table3 7 1 "双方联调" 12 $true $true
    Set-CellText $table3 7 2 "接口准备" 12 $true $true
    Set-CellText $table3 7 3 "平台提供`n回传接口文档、平台字段清单、联调配合信息" 10.5 $false $false
    Set-CellText $table3 7 4 "平台侧会统一给到标准底稿，便于后续多家保司复用。" 10 $false $false
    Set-CellText $table3 8 3 "保司提供`n带参拉起/短信下发文档、字段映射、联调环境说明" 10.5 $false $false
    Set-CellText $table3 8 4 "建议保司同步提供短信模板、H5 地址、测试账号及回传样例。" 10 $false $false

    $slide4 = $presentation.Slides.Item(4)
    Set-ShapeText $slide4 70 "需保司确认与补充资料" 24 | Out-Null
    $table4 = (Get-FirstTableShape $slide4).Table
    Set-CellText $table4 1 1 "事项" 16 $true $true
    Set-CellText $table4 1 2 "需保司回复" 16 $true $true
    Set-CellText $table4 2 1 "授权弹窗方案" 15 $true $true
    Set-CellText $table4 2 2 "请确认采用哪种口径：`nA. 独立授权确认页；`nB. 底部上拉授权确认。`n当前建议保留勾选《投保须知》《免责说明》后再进入投保。" 13 $false $false
    Set-CellText $table4 3 1 "投保须知与免责声明" 15 $true $true
    Set-CellText $table4 3 2 "请保司提供正式版《投保须知》《免责声明》文案、落款主体和展示要求，用于平台授权弹窗、短信说明页及保司 H5 统一展示。" 13 $false $false
    Set-CellText $table4 4 1 "联调补充资料" 15 $true $true
    Set-CellText $table4 4 2 "请补充字段映射、短信模板、拉起方式、附件传输方式、回传鉴权方式、测试环境地址及联系人。" 13 $false $false

    $slide5 = $presentation.Slides.Item(5)
    foreach ($id in @(18, 2)) {
        try {
            (Get-ShapeById $slide5 $id).Delete()
        } catch {
        }
    }
    Add-TitleText $slide5 (Cm 2.0) (Cm 1.4) (Cm 14.0) (Cm 1.2) "投保原型设计图（示意）" 22 "FFFFFF" | Out-Null
    Add-TitleText $slide5 (Cm 2.0) (Cm 2.5) (Cm 20.0) (Cm 0.8) "从左到右：入口选保司、短信发起提示、保司 H5 支付、保单关联成功" 10.5 "D8F7E8" | Out-Null

    $images = @(
        @{ Path = $page1; Left = Cm 1.9; Top = Cm 4.0; Width = Cm 6.7; Height = Cm 5.1; Caption = "入口选保司" },
        @{ Path = $page2; Left = Cm 9.0; Top = Cm 4.0; Width = Cm 6.7; Height = Cm 5.1; Caption = "短信发起提示" },
        @{ Path = $page4; Left = Cm 16.1; Top = Cm 4.0; Width = Cm 6.7; Height = Cm 5.1; Caption = "保司 H5 支付" },
        @{ Path = $page5; Left = Cm 23.2; Top = Cm 4.0; Width = Cm 6.7; Height = Cm 5.1; Caption = "保单关联成功" }
    )

    foreach ($img in $images) {
        $panel = $slide5.Shapes.AddShape(5, $img.Left - 6, $img.Top - 6, $img.Width + 12, $img.Height + 28)
        $panel.Fill.ForeColor.RGB = To-OleColor "F6FFFB"
        $panel.Fill.Transparency = 0.1
        $panel.Line.ForeColor.RGB = To-OleColor "9BE3C2"
        $panel.Line.Weight = 1
        $panel.ZOrder(1) | Out-Null

        if (Test-Path -LiteralPath $img.Path) {
            $slide5.Shapes.AddPicture($img.Path, 0, -1, $img.Left, $img.Top, $img.Width, $img.Height) | Out-Null
        }

        $caption = Add-TitleText $slide5 ($img.Left) ($img.Top + $img.Height + 4) $img.Width (Cm 0.7) $img.Caption 10 "FFFFFF"
        $caption.TextFrame.TextRange.ParagraphFormat.Alignment = 2
    }

    Add-NoteBox $slide5 (Cm 2.0) (Cm 10.4) (Cm 28.0) (Cm 2.1) "原型使用建议" "本页主要用于给保司快速建立对平台承接方式的直观认识，实际联调时可再补单页高清原型或交互稿。" "10392B" | Out-Null
    $lastNote = $slide5.Shapes.Item($slide5.Shapes.Count)
    $lastNote.TextFrame.TextRange.Font.Color.RGB = To-OleColor "E8FFF3"
    $lastNote.TextFrame.TextRange.Paragraphs(1).Font.Color.RGB = To-OleColor "FFFFFF"

    $presentation.Save()
    $presentation.Close()
    $ppt.Quit()

    Write-Output "PPT generated: $OutputPath"
}
finally {
    if ($presentation -ne $null) {
        try { $presentation.Close() } catch {}
    }
    if ($ppt -ne $null) {
        try { $ppt.Quit() } catch {}
    }
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()
}
