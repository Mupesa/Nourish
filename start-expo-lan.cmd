@echo off
set HTTP_PROXY=
set HTTPS_PROXY=
set ALL_PROXY=
set GIT_HTTP_PROXY=
set GIT_HTTPS_PROXY=
cd /d "%~dp0"
del expo-start.log 2>nul
del expo-start.err.log 2>nul
start "Nourish Expo" /min cmd.exe /c "npm --prefix mobile start -- --lan --port 8082 > expo-start.log 2> expo-start.err.log"
