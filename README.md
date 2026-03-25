                                          Library Management System (Full-Stack)  

This project is a full-stack library management system designed to simulate real-world library operations.

The backend is fully implemented using Node.js, Express, and MongoDB, handling authentication, role-based access control, and borrowing workflows.

The frontend is currently in development and will provide an interactive interface for users and administrators to manage books, borrowing, and system analytics.


                                            Core Features
    🔐 Authentication & Authorization
JWT-based authentication
Password hashing with bcrypt
Role-based access control:
Admin
Member
Restricted admin creation (onlyOneAdmin logic)

      📚 Book Management
View all books (public)
Get a specific book (authenticated)
Add new books (Admin only)
Update book details (Admin only)
Soft delete books (Admin only)

      🔄 Borrowing System
Borrow a book (Member)
Return a book
Track borrowing records
Update borrow records

      ⏰ Overdue Tracking
View all overdue books (Admin)
Search overdue records (by user or book)
Automatic handling with scheduled jobs (node-cron)


      👥 User Management (Admin)
View all users
View specific user details
View user borrowing history

      📊 Summary Dashboard (Admin)
Aggregated system insights via /summary
Protected admin-only analytics route

      Tech Stack
  Backend
Node.js
Express.js
MongoDB (Mongoose)
JWT (Authentication)
bcrypt
node-cron
Morgan (logging)


                                        Project Structure
Library-Management-System/
├── config/
│   └── db.js                 # Database connection
├── controllers/              # Business logic
├── middleware/
│   ├── authMiddleware.js     # Auth & role protection
│   └── errorHandler.js
├── models/                   # Mongoose schemas
├── public/                   #Frontend files(HTML, CSS, JS)
├── routes/
│   ├── userRoutes.js
│   ├── bookRoutes.js
│   ├── borrowRoutes.js
│   └── summaryRoutes.js
├── utils/                    # Helper functions
├── public/                   # Frontend (if applicable)
├── app.js                    # Entry point
├── .env
└── package.json



                                            Getting Started
  Prerequisites
Node.js
MongoDB (local or Atlas)

  Installation
git clone https://github.com/HajayB/Library-Management-System.git
cd Library-Management-System
npm install


Environment Variables
Create a .env file:
PORT=5000
MONGO_URI=your_database_url
JWT_SECRET=your_secret

Run the Server
npm start


                                        API Endpoints

  🔐 Auth & Users
Method	Endpoint	                      Description
POST	  /api/users/signup	              Register user (restricted admin logic applied)
POST	  /api/users/login	              Login user
POST	  /api/users/logout	              Logout user
GET	    /api/users/myprofile	          Get current user profile
GET	    /api/users/userdetails	        Get all users (Admin)
GET	    /api/users/userdetails/:userId	Get specific user (Admin)
GET	    /api/users/:userId/profile	    Get user profile + fines (Admin)

  📚 Books
Method	      Endpoint	          Description
GET	          /api/books	        Get all books
GET	          /api/books/:id	    Get single book (Auth)
POST	        /api/books/add	    Add book (Admin)
PUT	          /api/books/:id	    Update book (Admin)
DELETE	      /api/books/:id	    Soft delete book (Admin)
  🔄 Borrowing
Method	        Endpoint	                    Description
POST	          /api/borrow/borrow	          Borrow a book
PUT	            /api/borrow/return/:recordId	Return a book
GET	            /api/borrow/borrowed	        All borrow records (Admin)
GET  	          /api/borrow/overdue	          Overdue records (Admin)
GET	            /api/borrow/overdue/search	  Search overdue records
GET	            /api/borrow/user	            User borrow history
GET	            /api/borrow/:id	              Get single borrow record
PUT	            /api/borrow/:id	              Update borrow record

  📊 Summary
Method	      Endpoint	            Description
GET	          /api/summary	        Admin dashboard summary

                              🔑 Test Access

Admin functionality is available after authentication.

You can test endpoints using:
- Postman
- or the provided frontend interface

                                🔐 Access Control Summary
Feature	                Member	                Admin
View books	            ✅	                      ✅
Borrow/Return           ✅	                      ✅
Add/Edit/Delete books	  ❌	                      ✅
View all users	        ❌	                      ✅
View summaries	        ❌	                      ✅

                                    🎯 Key Highlights
Real-world RBAC (Role-Based Access Control)
Clean separation: routes → controllers → middleware
Borrowing lifecycle modeling
Overdue detection + cron jobs
Admin-restricted system control
Scalable backend structure

                                    Future Improvements
Fine payment integration
Notifications (email/SMS)
Rate limiting
API documentation (Swagger)
Complete Frontend Integration

  🌐 Full-Stack Architecture

- Backend: RESTful API built with Express and MongoDB
- Frontend: HTML, CSS, and Vanilla JavaScript (in progress)
- Communication: Client-side fetch requests to API endpoints
- Authentication: Token-based (JWT)

The frontend will consume the backend API to provide a complete user experience.

  🚧 Frontend Status

The frontend is currently under development.

Planned features include:
- User dashboard
- Book browsing interface
- Borrow/return interactions
- Admin panel for managing books and users
- Data visualization for system insights
- 
- Admin features are fully implemented
- User-facing interface is in progress

The API is fully functional and can be tested via tools like Postman.

                                        What I Learned

- Designing role-based access control systems
- Structuring scalable Express applications
- Managing real-world workflows (borrowing lifecycle)
- Implementing cron jobs for background tasks
- Connecting backend APIs to frontend interfaces
📌 Author
HajayB
GitHub: https://github.com/HajayB
