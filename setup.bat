@echo off
echo Setting up Secure File Sharing Web App...
echo.

echo Installing dependencies...
npm install

echo.
echo Creating .env file from template...
if not exist .env (
    copy env.example .env
    echo .env file created. Please edit it with your configuration.
) else (
    echo .env file already exists.
)

echo.
echo Creating uploads directory...
if not exist uploads (
    mkdir uploads
    echo Uploads directory created.
) else (
    echo Uploads directory already exists.
)

echo.
echo Setup complete!
echo.
echo To start the application:
echo 1. Edit .env file with your configuration
echo 2. Run: npm start
echo 3. Open http://localhost:3000 in your browser
echo.
pause 