# LoomSense AI — Hackathon MVP

## Run the backend
```
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
SQLite DB (`loomsense.db`) and demo data are created automatically on first run.

## Run the frontend
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Demo login
| Username | Password |
|---|---|
| lakshmi | demo123 |
| ravi | demo123 |
| meena | demo123 |
