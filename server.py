from pathlib import Path

from fastapi.staticfiles import StaticFiles

from main import app

FRONTEND_DIR = Path(__file__).parent / "frontend"

# 프론트엔드 화면 (frontend 폴더) -> 주소만 입력하면 바로 접속
# 이전에 공유한 /ui 주소도 계속 열리도록 같이 연결
app.mount("/ui", StaticFiles(directory=FRONTEND_DIR, html=True), name="ui")
# "/" 는 나머지 모든 경로를 받으므로 반드시 맨 마지막에 연결
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")


# 터미널 1: 서버

# cd C:\Users\MIN9YU\Documents\workspace\study_fast_api
# .venv\Scripts\Activate.ps1
# fastapi dev server.py --host 0.0.0.0 --port 8080

# 터미널 2: 고정 주소 터널

# cd C:\Users\MIN9YU\Documents\workspace\study_fast_api
# .\ngrok.exe http 8080 --url=unifier-mounting-traffic.ngrok-free.dev

# test_1