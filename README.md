# 🏠 Luxe Real Estates

**Luxe Real Estates** is a modern full-stack real estate platform built with **Next.js, TypeScript, FastAPI, and PostgreSQL**. It provides a scalable foundation for property discovery and management, including buyer, seller, and admin workflows, property listings and verification, inquiries, and appointment management.

## 🛠️ Tech Stack

### Frontend

* **Next.js 15**
* **TypeScript**
* **Tailwind CSS**
* **Shadcn UI**
* **Framer Motion**
* **Lucide React**
* **Axios**

###Auth
* **Clerk**

### Backend

* **Python**
* **FastAPI**
* **Pydantic**
* **Uvicorn**
* **SQLAlchemy**
* **PostgreSQL**
* **Alembic**

## 📁 Project Structure

```text
Luxe-Real-estates/
├── frontend/    # Next.js application
└── backend/     # FastAPI application
```

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/Luxe-Real-estates.git
cd Luxe-Real-estates
```

### 2. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

* Frontend: `http://localhost:3000`

### 3. Run Backend

Open a new terminal:

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

* Backend: `http://localhost:8000`
* API Documentation: `http://localhost:8000/docs`

### 4. Clerk credentials 
* ** Create and add clerk api to this project **

### 5. Neon db
* ** Create and add Neon db **

### macOS / Linux

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## 🔧 Troubleshooting

### Frontend Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

**Windows PowerShell:**

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Backend Dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

If `requirements.txt` is unavailable:

```bash
pip install fastapi uvicorn pydantic sqlalchemy psycopg2-binary alembic python-dotenv
```

## 🔄 Run Both Services

### Terminal 1 — Frontend

```bash
cd frontend
npm run dev
```

* `http://localhost:3000`

### Terminal 2 — Backend

```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --reload
```

* `http://localhost:8000`

## 📌 Project Status

🚧 **Active Development**

* Work in progress
* Features are continuously being developed and improved
* Additional functionality will be added in future updates

---

### 🏡 Luxe Real Estates

**Find. Verify. Visit. Own.**
