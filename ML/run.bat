@echo off
cd /d "%~dp0"
echo ==============================================
echo  Vishwautsav ML Analytics Dashboard
echo ==============================================
echo  Checking dependencies...
pip install -r requirements.txt --quiet
echo  Dependencies OK!
echo  Starting dashboard at http://localhost:8501
echo ==============================================
python -m streamlit run dashboard.py --server.port 8501 --server.headless false
pause
