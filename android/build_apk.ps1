# ==============================================================================
# VivekMarg Mentor - Standalone Android APK Build Pipeline
# Compiles, Dexes, Packages, Aligns, and Signs Debug APK using Android Build-Tools 35
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BUILDING VIVEKMARG MENTOR ANDROID APK (Android 15 / API 35)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$RepoRoot = Split-Path -Parent $PSScriptRoot
$AndroidDir = $PSScriptRoot

# Tool Paths
$SdkTools = "C:\Users\SUJAL\AppData\Local\Android\Sdk\build-tools\35.0.0"
$AndroidJar = "C:\Users\SUJAL\AppData\Local\Android\Sdk\platforms\android-35\android.jar"
$JdkHome = "C:\Program Files\Android\Android Studio\jbr"
$JdkBin = "$JdkHome\bin"

$env:JAVA_HOME = $JdkHome
$env:PATH = "$JdkBin;$env:PATH"

$Aapt2 = "$SdkTools\aapt2.exe"
$D8 = "$SdkTools\d8.bat"
$Zipalign = "$SdkTools\zipalign.exe"
$ApkSigner = "$SdkTools\apksigner.bat"
$Javac = "$JdkBin\javac.exe"
$Keytool = "$JdkBin\keytool.exe"
$Jar = "$JdkBin\jar.exe"

# Workspace Directories
$BuildDir = Join-Path $AndroidDir "build"
$CompiledResDir = Join-Path $BuildDir "compiled_res"
$GenDir = Join-Path $BuildDir "gen"
$ClassesDir = Join-Path $BuildDir "classes"
$StagingDir = Join-Path $BuildDir "staging"
$DistDir = Join-Path $AndroidDir "dist"

# Clean & Prepare
Write-Host "`n[1/7] Preparing build workspace..." -ForegroundColor Yellow
if (Test-Path $BuildDir) { Remove-Item -Recurse -Force $BuildDir }
if (Test-Path $DistDir) { Remove-Item -Recurse -Force $DistDir }

New-Item -ItemType Directory -Force -Path $CompiledResDir | Out-Null
New-Item -ItemType Directory -Force -Path $GenDir | Out-Null
New-Item -ItemType Directory -Force -Path $ClassesDir | Out-Null
New-Item -ItemType Directory -Force -Path $DistDir | Out-Null

# Prepare Staging Directory for Normalized Forward-Slash Assets
$StagingWww = Join-Path $StagingDir "assets\www"
New-Item -ItemType Directory -Force -Path $StagingWww | Out-Null
Copy-Item "$RepoRoot\www\*" $StagingWww -Force

# Step 1: Compile Resources with AAPT2
Write-Host "[2/7] Compiling Android resources with AAPT2..." -ForegroundColor Yellow
$ResZip = Join-Path $CompiledResDir "resources.zip"
$ResDir = Join-Path $AndroidDir "app\src\main\res"
& $Aapt2 compile --dir $ResDir -o $ResZip

# Step 2: Link Resources and generate R.java & base APK
Write-Host "[3/7] Linking resources & manifest (TargetSDK 35, MinSDK 21)..." -ForegroundColor Yellow
$Manifest = Join-Path $AndroidDir "app\src\main\AndroidManifest.xml"
$BaseApk = Join-Path $BuildDir "base_resources.apk"

& $Aapt2 link -o $BaseApk -I $AndroidJar --manifest $Manifest --min-sdk-version 21 --target-sdk-version 35 --version-code 1 --version-name "1.0.0" --java $GenDir $ResZip --auto-add-overlay

# Step 3: Compile Java Sources
Write-Host "[4/7] Compiling Java source files (MainActivity.java, SpeechBridge.java, R.java)..." -ForegroundColor Yellow
$JavaFiles = Get-ChildItem -Path (Join-Path $AndroidDir "app\src\main\java"), $GenDir -Recurse -Filter "*.java" | Select-Object -ExpandProperty FullName
& $Javac -source 8 -target 8 -cp $AndroidJar -d $ClassesDir $JavaFiles

# Step 4: Convert Java Classes to classes.dex with D8
Write-Host "[5/7] Converting bytecode to classes.dex using D8..." -ForegroundColor Yellow
$ClassFiles = Get-ChildItem -Path $ClassesDir -Recurse -Filter "*.class" | Select-Object -ExpandProperty FullName
& $D8 --output $BuildDir $ClassFiles --lib $AndroidJar

# Step 5: Package Assets & classes.dex into APK using Forward-Slash Zip normalization
Write-Host "[6/7] Merging forward-slash normalized assets/www and classes.dex..." -ForegroundColor Yellow
$DexFile = Join-Path $BuildDir "classes.dex"
if (-not (Test-Path $DexFile)) {
    throw "classes.dex was not generated."
}

# Add classes.dex to root of APK
Push-Location $BuildDir
& $Jar uf "base_resources.apk" "classes.dex"
Pop-Location

# Add assets/ directory with normalized Unix forward-slashes
Push-Location $StagingDir
& $Jar uf $BaseApk "assets"
Pop-Location

# Step 6: Align and Sign APK
Write-Host "[7/7] Zipaligning and signing APK with debug keystore..." -ForegroundColor Yellow
$AlignedApk = Join-Path $BuildDir "aligned.apk"
$FinalApk = Join-Path $DistDir "vivekmarg-mentor-debug.apk"
$Keystore = Join-Path $BuildDir "debug.keystore"

# 4-byte boundary alignment
& $Zipalign -v -p 4 $BaseApk $AlignedApk | Out-Null

# Generate debug keystore if needed
if (-not (Test-Path $Keystore)) {
    & $Keytool -genkey -v -keystore $Keystore -alias androiddebugkey -storepass android -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=VivekMargMentor, OU=Android, O=VivekMarg, C=IN"
}

# Sign APK
& $ApkSigner sign --ks $Keystore --ks-pass "pass:android" --ks-key-alias "androiddebugkey" --key-pass "pass:android" --out $FinalApk $AlignedApk

# Verify signature
Write-Host "`n>>> Verifying signed APK signatures (v1, v2, v3)..." -ForegroundColor Cyan
& $ApkSigner verify --verbose $FinalApk

$ApkSize = (Get-Item $FinalApk).Length / 1MB
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  APK BUILD SUCCESSFUL!                                   " -ForegroundColor Green
Write-Host "  Output: $FinalApk" -ForegroundColor Green
Write-Host "  Size:   $([math]::Round($ApkSize, 2)) MB" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
