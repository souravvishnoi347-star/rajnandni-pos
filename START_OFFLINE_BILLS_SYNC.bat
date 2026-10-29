@echo off
title Rajnandini Boutique - Laptop Realtime Bills Sync Vault
color 0A
cd /d "%~dp0"
echo ============================================================
echo   RAJNANDINI BOUTIQUE - REALTIME LAPTOP BILLS SYNC VAULT
echo ============================================================
echo Connecting to live Supabase cloud...
echo Keep this window open in background to auto-save every bill.
echo.
node scripts/live_laptop_sync.js
pause
