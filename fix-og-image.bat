@echo off
set "SOURCE=C:\Users\user\.gemini\antigravity\brain\211d4f01-e189-499b-8d3e-53269d244f6b\humura_ai_og_preview_1777969551287.png"
set "DEST=c:\Users\user\Music\inkingi AI\public\og-image.png"

echo Moving Humura AI Preview Image...
if exist "%SOURCE%" (
    copy "%SOURCE%" "%DEST%" /Y
    echo.
    echo [SUCCESS] Preview image placed in public/og-image.png
    echo [SUCCESS] Your SEO setup is now COMPLETE.
) else (
    echo.
    echo [ERROR] Could not find the source image at:
    echo %SOURCE%
    echo.
    echo Please ask me to regenerate the image.
)
echo.
pause
