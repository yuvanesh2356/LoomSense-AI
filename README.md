# 🧵 LoomSense AI

> **AI-Powered Demand Forecasting & Income Stability Platform for Handloom Weavers**

LoomSense AI is an AI-powered decision support platform that empowers handloom weavers to make smarter production decisions through intelligent demand forecasting. By analyzing historical trends, seasonal demand, and production patterns, the platform recommends **what to weave, how much to produce, and when to produce**, helping improve income stability while reducing financial risk.

---

## 🚀 Quick Access

| Resource | Link |
|----------|------|
| 🌐 **Live Demo** | https://loom-sense-ai.vercel.app/ |
| 🎥 **Demo Video** | https://drive.google.com/file/d/1cdi-2p-BnP-jS-Qpp-slL6iTHDJorewd/view?usp=drivesdk |
| ⚙️ **Backend API** | https://loomsense-ai.onrender.com |
| 📘 **API Documentation (Swagger)** | https://loomsense-ai.onrender.com/docs |

---

## 📖 Problem Statement

Many handloom weavers still rely on intuition and local market trends to decide what to produce. This often results in:

- ❌ Uncertain market demand
- ❌ Overproduction and unsold inventory
- ❌ Income instability
- ❌ Inefficient production planning
- ❌ Lack of digital decision-support tools

LoomSense AI addresses these challenges through AI-powered forecasting, explainable recommendations, and financial planning.

---

## ✨ Key Features

### 📈 AI Demand Forecasting
- Predicts the most suitable product to weave
- Recommends optimal production quantity
- Suggests target completion date
- Provides confidence score for every recommendation

### 🧠 Explainable AI
- Explains why each recommendation is generated
- Considers:
  - Seasonal demand
  - Historical cluster sales
  - Customer search trends
  - Production history

### 📊 Smart Dashboard
- Personalized production recommendations
- Income Stability Score
- Monthly income analytics
- Low-income alerts

### 📅 Income Calendar
- Rolling 12-month income forecast
- Projected vs Actual income comparison
- Income safety threshold monitoring

### 🔄 Scenario Simulator
- Compare alternative production strategies
- Predict financial impact instantly
- Enable informed production planning

---

## 🛠️ Technology Stack

### 💻 Frontend
- ⚛️ React
- 📘 TypeScript
- 🎨 Tailwind CSS
- 📊 Recharts
- 🌐 Axios

### ⚙️ Backend
- 🚀 FastAPI
- 🐍 Python
- 🗄️ SQLite
- 🧩 SQLAlchemy
- 🔐 JWT Authentication

### ☁️ Deployment
- ▲ Vercel
- 🎯 Render
- 🐙 GitHub

---

## 📂 Project Structure

```text
LoomSense-AI/
│
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── ai_engine.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Forecast.tsx
│   │   │   └── Income.tsx
│   │   └── components/
│   │       └── ui.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── index.html
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/yuvanesh2356/LoomSense-AI.git

cd LoomSense-AI
```

---

### ⚙️ Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

Swagger Documentation:

```
http://localhost:8000/docs
```

---

### 💻 Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 🔑 Demo Credentials

| Username | Password |
|----------|----------|
| 👤 lakshmi | demo123 |
| 👤 ravi | demo123 |
| 👤 meena | demo123 |

---

## 🎯 Impact

LoomSense AI helps:

- ✅ Improve production planning
- ✅ Reduce overproduction
- ✅ Increase income stability
- ✅ Enable transparent AI-assisted decisions
- ✅ Reduce financial uncertainty
- ✅ Promote digital transformation in the handloom sector
- ✅ Support sustainable livelihoods for weavers

---

## 🔮 Future Scope

- 🌍 Live marketplace integration
- 🏛️ Government handloom scheme integration
- 🌦️ Weather-aware demand forecasting
- 📱 Mobile application
- 🌐 Multi-language support
- 📈 Cooperative analytics dashboard
- 🤖 AI-powered assistant for weavers

---

## 📜 License

This project was developed as a prototype for **Handloom Hackathon 2026** and is intended for educational and demonstration purposes.

---

## 🙏 Acknowledgements

Developed for **Handloom Hackathon 2026** to demonstrate how Artificial Intelligence can empower India's handloom ecosystem through data-driven production planning and financial decision support.

⭐ If you found this project interesting, consider giving the repository a **Star** on GitHub!
