 Luxe Real Estates

Luxe Real Estates is a modern full-stack real estate platform built with Next.js, TypeScript, FastAPI, and PostgreSQL. It provides a scalable foundation for property discovery and management, including buyer, seller, and admin workflows, property listings and verification, inquiries, and appointment management.

🛠️ Tech Stack

Frontend

* Next.js 15
* TypeScript
* Tailwind CSS
* Shadcn UI
* Framer Motion
* Lucide React
* Axios

Backend

* Python
* FastAPI
* Pydantic
* Uvicorn
* SQLAlchemy
* PostgreSQL
* Alembic

 📁 Structure


Luxe-Real-estates/
├── frontend/    # Next.js application
└── backend/     # FastAPI application


 🚀 Getting Started

 1. Clone


git clone https://github.com/YOUR-USERNAME/Luxe-Real-estates.git
cd Luxe-Real-estates


 2. Frontend


cd frontend
npm install
npm run dev


Runs at: `http://localhost:3000`


 3. Backend
 4. 

Open a new terminal:


cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload


Runs at: `http://localhost:8000`

API documentation: `http://localhost:8000/docs`


 macOS / Linux


python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload


🔧 If Dependencies Fail

Frontend:


rm -rf node_modules package-lock.json
npm install


Windows PowerShell:


Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install


Backend:


python -m pip install --upgrade pip
pip install -r requirements.txt


If `requirements.txt` is unavailable:

pip install fastapi uvicorn pydantic sqlalchemy psycopg2-binary alembic python-dotenv



🔄 Run Both Services

Terminal 1:


cd frontend
npm run dev


Terminal 2:


cd backend
venv\Scripts\activate
uvicorn main:app --reload


 📌 Project Status

🚧 Active Development

Work on progress...

Luxe Real Estates — Find. Verify. Visit. Own.
