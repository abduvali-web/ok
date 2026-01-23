$path = "c:\Users\User\Downloads\ok-main\ok-main\src\app\middle-admin\page.tsx"
$content = Get-Content $path -Raw

# Replace start tags with space: < Tag -> <Tag
$content = $content -replace '< ([a-zA-Z]+)', '<$1'

# Replace end tags with space: </ Tag > -> </Tag>
$content = $content -replace '</ ([a-zA-Z]+) >', '</$1>'
$content = $content -replace '</ ([a-zA-Z]+)>', '</$1>'

# Replace attribute assignments with spaces: attr = " -> attr="
$content = $content -replace '([a-zA-Z]+) = "', '$1="'

# Replace attribute assignments with braces: attr = { -> attr={
$content = $content -replace '([a-zA-Z]+) = {', '$1={'

# Fix specific JSX issues if any remain
$content = $content -replace '< div', '<div'
$content = $content -replace '</ div', '</div'

Set-Content $path $content
Write-Host "File cleaned"
