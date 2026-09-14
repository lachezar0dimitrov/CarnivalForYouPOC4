@echo off
REM Двоен клик върху този файл стартира импорта на нова фактура —
REM ще се отвори прозорец за избор на PDF, после автоматично ще
REM претърси rubiesuk.com, ще свали снимки и ще направи Excel таблица
REM за преглед в папка imports\.
cd /d "%~dp0"
call npm run import:invoice
echo.
pause
