@echo off
echo Adding Windows Firewall rules for Marcus...
netsh advfirewall firewall add rule name="Marcus Vite 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Marcus Terminal 3001" dir=in action=allow protocol=TCP localport=3001
echo.
echo Done! You can close this window.
pause
