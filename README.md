# Startup Funding and Investment Tracking System (SFITS)

A full-stack Startup Funding and Investment Tracking System developed to streamline startup fundraising, investor participation, founder equity management, cap table tracking, and investment monitoring through a centralized database-driven platform.

Built as part of a Database Management Systems (DBMS) course project, SFITS demonstrates the practical implementation of relational database design, normalization, SQL operations, cloud database deployment, and role-based startup ecosystem management.

---

# Academic Focus

This project showcases the implementation of core DBMS concepts, including:

* Relational Database Design
* Entity Relationship Modeling (ERD)
* Database Normalization (up to 3NF)
* Primary & Foreign Key Constraints
* Referential Integrity
* SQL Queries and Joins
* Transaction-Based Operations
* Investment Tracking Systems
* Equity Management
* Funding Round Management
* Cloud Database Deployment
* Full-Stack Database Application Development

---

# Live Deployment

## Frontend

https://super-druid-8a8562.netlify.app

## Backend

https://startup-funding-investment-tracking.onrender.com

## Database

Aiven Cloud MySQL Database

---

# Problem Statement

Early-stage startups often struggle to maintain organized records of founders, funding rounds, investor participation, ownership dilution, and investment history.

Investors also require a centralized platform to:

* Discover startups
* Analyze funding information
* Monitor investment portfolios
* Track equity ownership

The Startup Funding and Investment Tracking System addresses these challenges through a structured relational database and a role-based management platform.

---

# Project Objectives

* Centralize startup funding information
* Track funding rounds efficiently
* Maintain founder equity records
* Monitor investor participation
* Manage startup profiles
* Generate cap table information
* Reduce data redundancy
* Maintain accurate investment history
* Support informed investment decisions

---

# Key Features

## Startup Management

* Register and manage startups
* Store startup details and industry information
* Track startup growth metrics
* Maintain startup profiles

## Founder Management

* Add founders to startups
* Track founder ownership percentages
* Maintain founder information
* Record equity history

## Funding Round Management

* Create funding rounds
* Track round stages
* Monitor target funding
* Record total amount raised

## Investment Management

* Allow investors to invest in startups
* Track investment amounts
* Record equity acquired
* Maintain investment history

## Cap Table Management

* Calculate ownership distribution
* Monitor founder dilution
* Display current equity structure

## Startup Profiles

* Business description
* Market information
* Product details
* Growth metrics
* Future roadmap

## Investor Dashboard

* Browse startups
* View startup details
* Make investments
* Track portfolio performance

## Founder Dashboard

* Monitor startup metrics
* Track funding progress
* View equity ownership
* Manage startup information

## Authentication & Access Control

* Secure login system
* Role-based dashboards
* Startup-specific data visibility

---

# User Roles

| Role     | Responsibilities                                                                        |
| -------- | --------------------------------------------------------------------------------------- |
| Founder  | Manage startup information, founders, funding rounds, startup profile, and track equity |
| Investor | Browse startups, invest in funding rounds, monitor investments and portfolio            |

---

# Startup Investment Workflow

1. Founders register and create accounts.
2. Founders register startups.
3. Founders add founding team members.
4. Founders create funding rounds.
5. Investors browse available startups.
6. Investors participate in funding rounds.
7. Investments are recorded automatically.
8. Equity ownership is updated.
9. Cap tables reflect current ownership structure.
10. Founders monitor fundraising progress through dashboards.

---

# System Architecture

User

↓

Frontend (HTML, CSS, JavaScript)

↓

Node.js + Express Backend

↓

MySQL Database (Aiven)

---

# Deployment Architecture

Netlify

↓

Render Backend

↓

Aiven Cloud MySQL Database

---

# Database Highlights

The database consists of interconnected entities representing startup fundraising operations.



## Major Entities

| Entity                  | Description                        |
| ----------------------- | ---------------------------------- |
| Users                   | Authentication and role management |
| Startup                 | Startup information                |
| Founder                 | Founder records                    |
| Investor                | Investor records                   |
| Industry                | Startup industry classification    |
| Funding Round           | Funding round details              |
| Investment              | Investor participation records     |
| Equity History          | Founder equity tracking            |
| Startup Profile         | Business profile information       |
| Investor Focus Industry | Investor interests                 |

---

# Database Statistics

Current Production Database:

* 21 Users
* 4 Startups
* 6 Founders
* 7 Funding Rounds
* 4 Investments
* 18 Equity History Records

Hosted on Aiven Cloud MySQL.

---

# Entity Relationship Diagram

<img width="1611" height="1051" alt="DBMS_mini_project_ER_final" src="https://github.com/user-attachments/assets/417c91d9-0903-4c4d-a2a7-ad754bd0847f" />


The ER diagram represents the relationships between startups, founders, investors, funding rounds, investments, equity history, industries, and startup profiles.

---

# DBMS Concepts Implemented

## Entity Relationship Modeling

Designed a relational schema representing:

* Users
* Startup
* Founder
* Investor
* Industry
* Funding Round
* Investment
* Equity History
* Startup Profile

## Normalization

Database normalized to reduce:

* Data redundancy
* Update anomalies
* Insertion anomalies
* Deletion anomalies

## Relationships

### One-to-Many

* One Startup → Many Founders
* One Startup → Many Funding Rounds
* One Funding Round → Many Investments

### Many-to-Many

Implemented using linking tables.

Examples:

* Investors ↔ Funding Rounds
* Investors ↔ Industries

## Constraints

* Primary Keys
* Foreign Keys
* Unique Constraints
* NOT NULL Constraints
* Referential Integrity Rules

## SQL Operations

* SELECT
* INSERT
* UPDATE
* DELETE
* JOIN
* GROUP BY
* Aggregate Functions
* Nested Queries
* Subqueries

---

# Data Integrity

Maintained using:

* Referential Integrity
* Foreign Key Constraints
* Input Validation
* Controlled Data Updates

---

# Repository Structure

SFITS_DBMS

├── Backend

│ ├── server.js

│ └── sfits_final_backup.sql

│

├── Database

│ ├── schema.sql

│ └── seed.sql

│

├── Frontend

│ ├── pages/

│ ├── investor_pages/

│ ├── dashboard.html

│ ├── founder_dashboard.html

│ ├── investor_dashboard.html

│ ├── login.html

│ ├── signup.html

│ ├── welcome.html

│ ├── styles.css

│ └── theme.js

│

├── README.md

├── package.json

├── package-lock.json

└── .gitignore

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript
* Tailwind CSS

## Backend

* Node.js
* Express.js

## Database

* MySQL

## Cloud Services

* Aiven Database Hosting
* Render Backend Hosting
* Netlify Frontend Hosting

## Development Tools

* Visual Studio Code
* Git
* GitHub
* MySQL Workbench

---

# Deployment Achievements

✅ Aiven Cloud MySQL Database Deployment

✅ Render Backend Deployment

✅ Netlify Frontend Deployment

✅ Environment Variable Configuration

✅ End-to-End Production Testing

✅ Cloud Database Connectivity Verification

✅ Cross-Role Testing Completed

---

# Screenshots

## Welcome Page

<img width="924" height="422" alt="image" src="https://github.com/user-attachments/assets/17e34c9c-4fba-4753-92e6-e6015c8ea668" />


---

## Login Page

<img width="755" height="422" alt="image" src="https://github.com/user-attachments/assets/bbc81c13-7ae7-4e39-908a-1fd224c01340" />


---

## Signup Page

<img width="638" height="416" alt="image" src="https://github.com/user-attachments/assets/e584aef5-09fa-4ece-9cd2-2fb427b9ed53" />


---

## Founder Dashboard

<img width="955" height="431" alt="image" src="https://github.com/user-attachments/assets/33070386-9ea6-4250-89d1-249eed799b9e" />


---

## Startup Management Page

<img width="949" height="428" alt="image" src="https://github.com/user-attachments/assets/5af4f969-94f0-4c5c-aaa0-39740928a2d0" />


---

## Founder Management Page

<img width="950" height="427" alt="image" src="https://github.com/user-attachments/assets/c1697cf6-b26d-453c-86c3-f87062e199be" />


---

## Funding Round Management Page

<img width="950" height="427" alt="image" src="https://github.com/user-attachments/assets/64cbd775-8cbe-434a-9098-49462673b4e7" />


---

## Startup Profile Page

<img width="955" height="430" alt="image" src="https://github.com/user-attachments/assets/e46a9b32-d668-42da-9587-6e97a41f8e8c" />


---

## Cap Table Page

<img width="952" height="424" alt="image" src="https://github.com/user-attachments/assets/1f3ff4c4-0c65-4201-968a-0ddc26e386fb" />


---

## Equity History Page

<img width="952" height="368" alt="image" src="https://github.com/user-attachments/assets/e965541e-40d7-45cd-9603-7a0e37e6f8ff" />
<img width="783" height="277" alt="image" src="https://github.com/user-attachments/assets/26a1e756-d52b-44e3-a295-4115c3ad6528" />



---

## Investor Dashboard

<img width="956" height="425" alt="image" src="https://github.com/user-attachments/assets/b95774a3-8dc8-4d53-9fd0-7a0664f6469b" />


---

## Browse Startups Page

<img width="959" height="430" alt="image" src="https://github.com/user-attachments/assets/0bdbaadb-0781-4dcf-80f1-401a71054f62" />


---

## Investment Page

<img width="943" height="425" alt="image" src="https://github.com/user-attachments/assets/1fb305dd-2a8d-4a0d-b80e-3de445702df6" />


---

## My Investments Page

<img width="957" height="428" alt="image" src="https://github.com/user-attachments/assets/d06dc224-65d6-4f51-a552-e0bfd18f6d87" />


---

# Features Implemented

✅ User Authentication

✅ Role-Based Dashboards

✅ Startup Management

✅ Founder Management

✅ Funding Round Management

✅ Investment Tracking

✅ Startup Profiles

✅ Cap Table Generation

✅ Equity History Tracking

✅ Investor Portfolio Monitoring

✅ Cloud Database Integration

✅ Frontend Deployment

✅ Backend Deployment

✅ End-to-End Testing

---

# Local Setup

## Clone Repository

```bash
git clone https://github.com/Tejal-Udgave/Startup-Funding-Investment-Tracking-System-DBMS.git

cd Startup-Funding-Investment-Tracking-System-DBMS
```

## Backend Setup

```bash
cd Backend

npm install

npm start
```

## Frontend

Open:

Frontend/welcome.html

or

Frontend/login.html

in your browser.

---

# Challenges Faced

* Designing a normalized startup investment schema
* Maintaining referential integrity
* Managing founder equity calculations
* Implementing cap table logic
* Handling startup-specific filtering
* Integrating cloud-hosted database services
* Deploying frontend and backend separately
* Debugging production deployment issues

---

# Future Enhancements

* Password hashing and encryption
* Forgot Password functionality
* Email verification
* Investor recommendation engine
* Real-time notifications
* Document management for startups
* Funding milestone tracking
* AI-powered startup evaluation
* Mobile application support

---

# Tools and Resources Used

* Draw.io — ER Diagram Design
* Visual Studio Code — Development Environment
* GitHub — Version Control
* Aiven — Cloud Database Hosting
* Render — Backend Hosting
* Netlify — Frontend Hosting
* ChatGPT — Development assistance, deployment guidance.
* Claude - Debugging,  and project enhancement.

---

# Acknowledgements

Special thanks to the DBMS course faculty, open-source community, and modern cloud platforms that made the deployment and testing of this project possible.

---

# Academic Information

Course: Database Management Systems (DBMS)

Project Type: Semester Project

Academic Year: 2025–26

Student: Tejal Udgave

---

# License

This project was developed for educational and academic purposes as part of a Database Management Systems course.

⭐ If you found this project useful, consider giving it a star.
