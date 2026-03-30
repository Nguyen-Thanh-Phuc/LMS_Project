# Simple Validation Test

Write-Host "========== VALIDATION TESTS ==========" -ForegroundColor Cyan

# Test 1: Course validation - missing description
Write-Host "`nTest 1: Create Course - Missing description" -ForegroundColor Yellow
$body = @{title="Test Course"} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/courses" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    $response = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($response.success -eq $false) {
        Write-Host "PASS - " $response.message -ForegroundColor Green
    }
}

# Test 2: Lesson validation - missing videoUrl
Write-Host "`nTest 2: Create Lesson - Missing videoUrl" -ForegroundColor Yellow
$body = @{courseId="123"; title="Lesson 1"} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/lessons" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    $response = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($response.success -eq $false) {
        Write-Host "PASS - " $response.message -ForegroundColor Green
    }
}

# Test 3: Enrollment validation - missing userId
Write-Host "`nTest 3: Enroll Course - Missing userId" -ForegroundColor Yellow
$body = @{courseId="123"} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/enrollments" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    $response = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($response.success -eq $false) {
        Write-Host "PASS - " $response.message -ForegroundColor Green
    }
}

# Test 4: User role validation - invalid role
Write-Host "`nTest 4: Change User Role - Invalid role" -ForegroundColor Yellow
$body = @{role="superuser"} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/users/123/role" -Method PUT -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    $response = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($response.success -eq $false) {
        Write-Host "PASS - " $response.message -ForegroundColor Green
    }
}

# Test 5: Quiz validation - empty questions
Write-Host "`nTest 5: Create Quiz - Empty questions" -ForegroundColor Yellow
$body = @{title="Quiz"; courseId="123"; createdBy="456"; questions=@()} | ConvertTo-Json
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/quizzes" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "FAIL - Should have returned error" -ForegroundColor Red
} catch {
    $response = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($response.success -eq $false) {
        Write-Host "PASS - " $response.message -ForegroundColor Green
    }
}

# Test 6: Pagination validation
Write-Host "`nTest 6: Pagination - Default values applied" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/courses" -Method GET -ContentType "application/json" -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    if ($data.pagination) {
        Write-Host "PASS - Pagination works. Page: $($data.pagination.page), Limit: $($data.pagination.limit)" -ForegroundColor Green
    }
} catch {
    Write-Host "FAIL - " $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n===================================" -ForegroundColor Cyan
