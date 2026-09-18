@echo off
cd /d "%~dp0"
echo ==============================================
echo  Starting Vishwautsav ML Analytics Dashboard
echo ==============================================
python -m streamlit run dashboard.py
pause
