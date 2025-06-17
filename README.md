🖥️ Bigbluebutton-Meeting-Vue
A powerful and user-friendly frontend interface built with Vue 3 + TypeScript to interact with the Bigbluebutton-Meeting-Api (https://github.com/ismaile17/Bigbluebutton-Meeting-Api). Designed for online education, corporate training, and meeting management platforms.

> 🔗 **Backend API Project:** [Bigbluebutton-Meeting-Api](https://github.com/ismaile17/Bigbluebutton-Meeting-Api)

🎯 Purpose
This project provides a complete frontend layer to:

List, create, join, and manage meetings

Interact with BigBlueButton via the backend API

Organize participants, classrooms, and content

Handle permissions, roles, and post-meeting data

⚙️ Tech Stack
✅ Vue 3 + TypeScript

⚡ Vite for lightning-fast dev environment

🎨 TailwindCSS / PrimeVue (UI components)

🧩 Pinia for state management

🔌 Axios for API calls

🧭 Vue Router for navigation

📂 Folder Structure Highlights
Folder	Purpose
src/views	Page-level views (meetings, login, dashboard, participant, etc.)
src/components	Reusable UI components and icons
src/services	Axios-based API service calls
src/stores	Centralized state via Pinia (user, meeting, etc.)
src/router	Page navigation and access control (with role-based guards)
src/core	Utilities, enums, global types

📺 UI Features Overview
🗓️ Meeting Management
View upcoming and past meetings

Join as moderator or viewer (with role checks)

Schedule meetings with options like:

Duration

Password-protected access

Record on/off toggle

End meetings manually

📊 Participant & Attendance
View participant list per session

Check real-time join/leave data

Access detailed attendance records

Export reports (CSV/JSON ready)

🏫 Classroom System
Create & manage virtual classrooms

Assign roles: Teacher, Student, Assistant

Organize users into groups

Attach tasks, files, announcements

📁 Content and Task Modules
Upload and manage homework/assignments

Attach lesson materials (PDF, video, links)

Create due dates and task descriptions

Show progress in user dashboards

🧩 Permissions & Roles
Fine-grained access control per route/page

Dynamically rendered menus based on roles

Admin panel for role and user management

🔗 API Integration
This frontend works seamlessly with the backend:
🔹 Bigbluebutton-Meeting-Api (https://github.com/ismaile17/Bigbluebutton-Meeting-Api)

All endpoints (create/join meeting, fetch recordings, user actions, etc.) are consumed via src/services/.

Axios instances handle auth headers

Token refresh and login/logout integrated

Environment variables (e.g. .env) configure backend base URL

🚀 Development Setup
bash
Kopyala
Düzenle
git clone https://github.com/ismaile17/Bigbluebutton-Meeting-Vue.git
cd Bigbluebutton-Meeting-Vue
npm install
npm run dev
Make sure to configure the backend API base URL in .env:

env
Kopyala
Düzenle
VITE_API_BASE_URL=https://your-api-domain.com
👥 User Types Supported
👨‍🏫 Admins: full access to meetings, users, recordings

🧑‍🎓 Students: class-specific access, join links, homework

👥 Moderators: manage sessions, export reports

🔐 Guest Access (via token-based links)

📌 Key UX Features
Responsive layout (mobile/tablet support)

Notifications & confirmations (via useNotification.ts)

Error fallback routes and redirections

Dark/light theme potential via CSS vars

![UI Preview](https://github.com/ismaile17/Bigbluebutton-Meeting-Vue/blob/main/src/assets/images/1.jpg)

![UI Preview](https://github.com/ismaile17/Bigbluebutton-Meeting-Vue/blob/main/src/assets/images/2.jpg)

![UI Preview](https://github.com/ismaile17/Bigbluebutton-Meeting-Vue/blob/main/src/assets/images/3.jpg)

![UI Preview](https://github.com/ismaile17/Bigbluebutton-Meeting-Vue/blob/main/src/assets/images/4.jpg)

📄 License
MIT — free to use, extend, and adapt for your platform.
