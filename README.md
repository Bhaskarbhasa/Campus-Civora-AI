<div align="center">
  <img src="client/src/assets/hero.png" alt="Campus Civora AI Logo" width="150"/>
  <h1>Campus Civora AI</h1>
  <p><strong>Next-Generation Autonomous Campus Management System</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-18-blue" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node" />
    <img src="https://img.shields.io/badge/MongoDB-Mongoose-brightgreen" alt="MongoDB" />
    <img src="https://img.shields.io/badge/AI-Google_Gemini-orange" alt="Gemini" />
  </p>
</div>

<br />

## 🌟 Overview
Campus Civora AI is a comprehensive, microservices-inspired monolithic web application designed to completely automate and digitize university campus administration. Built as a Final Year Project, it replaces outdated paper-based ticketing systems with an autonomous, AI-driven digital hierarchy.

By leveraging **Google Gemini Generative AI**, Campus Civora reads unstructured student complaints, predicts priorities, routes tickets to correct departments, tracks SLA deadlines via cron jobs, and even autonomously matches lost & found items.

## ✨ Key Features
- **🧠 Generative AI Routing:** Gemini AI acts as a digital dispatcher, analyzing student complaints in real-time, predicting priority (Low/Medium/High/Emergency), and bypassing human bottlenecks.
- **🛡️ Multi-Tier RBAC:** Granular Role-Based Access Control supporting 14+ specific roles (Students, Faculty, Class Advisors, Wardens, Chief Wardens, Maintenance Supervisors, Directors, etc.).
- **⚖️ Digital Petitions:** A democratic polling system allowing students to gather signatures for policy changes. If a petition hits 30% student support, it automatically forces an official response from Deans.
- **🕵️ Semantic Duplicate Detection:** The AI scans recent database entries to identify and merge duplicate complaints in the same building, preventing technician overload.
- **🤝 AI Lost & Found:** Students upload descriptions of lost items. The AI semantically compares it against found items and calculates a confidence match score, linking them automatically.
- **⏰ Autonomous SLA Escalation:** Headless Node.js 
ode-cron workers run in the background. If a grievance or petition is ignored for 7 days, it mathematically forces an escalation to higher authorities.

## 🛠️ Tech Stack
- **Frontend:** React 18, Vite, Framer Motion (Animations), Zustand (State Management), Recharts.
- **Backend:** Node.js, Express.js, JWT (Authentication), Bcrypt (Cryptography).
- **Database:** MongoDB Atlas, Mongoose (Relational schemas).
- **AI & Cloud:** Google Gemini (1.5-Flash), Cloudinary (CDN Image Hosting), Multer.

## 🚀 Installation & Setup

1. **Clone the repository**
   `ash
   git clone https://github.com/YourUsername/Campus-Civora-AI.git
   cd Campus-Civora-AI
   `

2. **Install Server Dependencies**
   `ash
   cd server
   npm install
   `

3. **Install Client Dependencies**
   `ash
   cd ../client
   npm install
   `

4. **Environment Variables**
   Create a .env file in the /server directory and add the following keys:
   `env
   PORT=5004
   MONGODB_URI=your_mongodb_cluster_uri
   JWT_SECRET=your_jwt_cryptographic_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   `

5. **Run the Application**
   Open two terminals.
   
   Terminal 1 (Backend):
   `ash
   cd server
   npm run dev
   `
   
   Terminal 2 (Frontend):
   `ash
   cd client
   npm run dev
   `

## 📊 System Architecture
* **Frontend State:** Utilizes optimistic UI updates during 1.5-second AI calculation delays to ensure a frictionless user experience.
* **Security:** JWTs are securely handled, and Cross-Origin Resource Sharing (CORS) strictly locks API access to the React origin port. Passwords are cryptographically hashed using bcrypt (10 salt rounds).
* **Media Handling:** Local storage bloat is prevented by piping multipart form data directly from RAM buffers to the Cloudinary CDN.

---
<div align="center">
  <i>Developed as a Final Year Academic Project</i>
</div>
