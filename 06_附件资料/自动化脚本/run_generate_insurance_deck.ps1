$scriptPath = Join-Path $PSScriptRoot "generate_insurance_deck.ps1"
$scriptText = Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8
$scriptBlock = [scriptblock]::Create($scriptText)
& $scriptBlock
