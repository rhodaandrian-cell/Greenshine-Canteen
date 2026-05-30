@echo off
echo Compiling JSX files...
call npx babel js/BulkTable.jsx --out-file js/BulkTable.js
call npx babel js/BulkModal.jsx --out-file js/BulkModal.js
call npx babel js/BulkDailyRecord.jsx --out-file js/BulkDailyRecord.js
echo Done! You can now commit and push to GitHub.
pause