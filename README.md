# rewear
A marketplace for second-hand clothing. Sell an item, earn points, spend them on something else.
One point equals one shekel, with no commission.

Final project for a Full-Stack development course.

Tech stack

Backend: Node.js · Express · MongoDB Atlas · Mongoose
Frontend: HTML · CSS · Vanilla JavaScript
Auth: JWT · bcrypt
Images: Cloudinary
Charts: Chart.js

Getting started
bash
npm install
npm run seed     # populates the database with demo data
npm start        # http://localhost:3000

Create a .env file in the root:

MONGO_URI=<connection string>
JWT_SECRET=<secret>
PORT=3000
Demo accounts
Role	Email	Password
Admin	admin@rewear.com	Admin123
User	noa@rewear.com	User123
Project structure
├── server.js          entry point
├── seed.js            demo data
├── models/            Mongoose schemas
├── controllers/       business logic
├── routes/            routing and permissions
├── middleware/        JWT authentication
└── public/            client side

MVC architecture. Every request flows: router → middleware → controller → model.

Features
Three permission levels: guest, user, admin
Hierarchical filtering: gender → category → type, with sorting and pagination
Payment by card (Luhn validation) or points
Favourites, points history, item management
Admin dashboard with statistics and two aggregation pipelines
Team

Built by five developers, divided by domain — each responsible for a model,
controller, router and client-side code in her area:
authentication and permissions · products · shop and product page · orders and favourites · dashboard and content
