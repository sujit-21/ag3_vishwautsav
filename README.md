# Festivio | Festival & Event Management System

A premium MERN stack application for managing and discovering festivals and events.

## Features
- **Modern UI**: Built with React, Bootstrap 5, and Framer Motion.
- **Backend API**: Express.js server with MongoDB/Mongoose.
- **Authentication**: JWT-based auth (UI implemented).
- **Responsive**: Fully optimized for all screen sizes.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- MongoDB (Running locally or via Atlas)

### 1. Server Setup
```bash
cd server
npm install
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

### 3. ML Analytics Dashboard Setup
```bash
cd ML
pip install -r requirements.txt
python -m streamlit run dashboard.py
```
> Dashboard runs at: http://localhost:8501

## Technologies Used
- **Frontend**: React, Vite, Bootstrap, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Mongoose, JWT.
- **Database**: MongoDB.
- **ML / Analytics**: Python, Streamlit, Pandas, Scikit-learn, Plotly.
