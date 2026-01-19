# Script to fix all import paths after folder reorganization

# Fix auth pages (need ../../ for root imports)
$authFiles = Get-ChildItem "src/pages/auth/*.jsx"
foreach ($file in $authFiles) {
    (Get-Content $file.FullName) -replace 'from [''"]\.\./', 'from ''../../' | Set-Content $file.FullName
}

# Fix public pages (need ../../ for root imports)
$publicFiles = Get-ChildItem "src/pages/public/*.jsx"
foreach ($file in $publicFiles) {
    (Get-Content $file.FullName) -replace 'from [''"]\.\./', 'from ''../../' | Set-Content $file.FullName
}

# Fix AdminTeam (has wrong path)
(Get-Content "src/pages/admin/AdminTeam.jsx") -replace 'from [''"]\.\.\/services', 'from ''../../services' | Set-Content "src/pages/admin/AdminTeam.jsx"

# Fix EventAdminEvents import from AdminEvents
(Get-Content "src/pages/event-admin/EventAdminEvents.jsx") -replace 'from [''"]\.\/AdminEvents', 'from ''../admin/AdminEvents' | Set-Content "src/pages/event-admin/EventAdminEvents.jsx"

# Fix SuperAdminEvents import from AdminEvents
(Get-Content "src/pages/super-admin/SuperAdminEvents.jsx") -replace 'from [''"]\.\/AdminEvents', 'from ''../admin/AdminEvents' | Set-Content "src/pages/super-admin/SuperAdminEvents.jsx"

# Fix layout components (need ../../ for context, ../common/ for Logo)
$layoutFiles = Get-ChildItem "src/components/layout/*.jsx"
foreach ($file in $layoutFiles) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'from [''"]\.\.\/context', 'from ''../../context'
    $content = $content -replace 'from [''"]\.\/Logo', 'from ''../common/Logo'
    Set-Content $file.FullName -Value $content -NoNewline
}

# Fix auth components (need ../../ for context)
$authComponents = Get-ChildItem "src/components/auth/*.jsx"
foreach ($file in $authComponents) {
    (Get-Content $file.FullName) -replace 'from [''"]\.\.\/context', 'from ''../../context' | Set-Content $file.FullName
}

# Fix common components (need ../../ for context/utils)
$commonComponents = Get-ChildItem "src/components/common/*.jsx"
foreach ($file in $commonComponents) {
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace 'from [''"]\.\.\/context', 'from ''../../context'
    $content = $content -replace 'from [''"]\.\.\/utils', 'from ''../../utils'
    Set-Content $file.FullName -Value $content -NoNewline
}

# Fix booking components (need ../../ for context)
$bookingComponents = Get-ChildItem "src/components/booking/*.jsx"
foreach ($file in $bookingComponents) {
    (Get-Content $file.FullName) -replace 'from [''"]\.\.\/context', 'from ''../../context' | Set-Content $file.FullName
}

Write-Host "All imports fixed!" -ForegroundColor Green
