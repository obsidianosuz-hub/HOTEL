@echo off
echo ========================================================
echo Windows Xavfsizlik Devorida 5001-portni ochmoqdamiz...
echo ========================================================
netsh advfirewall firewall add rule name="Hotel ERP Node.js Server" dir=in action=allow protocol=TCP localport=5001
echo.
echo ========================================================
echo Tayyor! Endi telefoningiz orqali dasturga ulana olasiz.
echo ========================================================
pause
