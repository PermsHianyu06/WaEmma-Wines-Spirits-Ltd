# Waemma Business Management System

## Overview

The Waemma Business Management System is a full-stack web application designed for Waemma Wines & Spirits Ltd. It provides comprehensive business management capabilities including inventory management, sales tracking, delivery management, and crate tracking for a beverage retail business. The system is built with a React frontend and Node.js/Express backend, using PostgreSQL for data persistence.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with Vite build tool
- **Styling**: Tailwind CSS for responsive design with custom Waemma brand colors
- **UI Components**: Lucide React for icons, Chart.js for data visualization
- **Routing**: React Router DOM for single-page application navigation
- **State Management**: React hooks for local state management
- **HTTP Client**: Axios for API communication
- **PDF Generation**: jsPDF with autoTable for reports

### Backend Architecture
- **Framework**: Express.js with Node.js
- **Database ORM**: Sequelize for PostgreSQL database operations
- **Authentication**: Session-based authentication with express-session
- **Security**: Helmet for security headers, CORS for cross-origin requests, rate limiting
- **Password Hashing**: bcryptjs for secure password storage
- **API Structure**: RESTful API with modular route handlers

### Data Models
The system implements a comprehensive database schema with the following core entities:
- **Users**: Role-based access control (admin, manager, staff)
- **Products**: Inventory items with categories, pricing, and stock tracking
- **Sales**: Transaction records with receipt numbers and payment methods
- **SaleItems**: Line items for sales transactions
- **Deliveries**: Supplier delivery records
- **DeliveryItems**: Line items for delivery records
- **CrateTracking**: Specialized tracking for returnable containers

### Security Features
- Session-based authentication with secure cookies
- Role-based authorization middleware
- Input validation using Sequelize validators
- Rate limiting to prevent abuse
- Security headers via Helmet middleware
- Password hashing with bcrypt

### Database Design
- **Relationships**: Properly defined associations between entities
- **Constraints**: Foreign key constraints and data validation
- **Indexing**: Primary keys and unique constraints for performance
- **Data Integrity**: Cascade operations and referential integrity

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL for data persistence
- **Runtime**: Node.js for backend execution
- **Build Tool**: Vite for frontend development and building

### Authentication & Security
- **Session Management**: express-session for user sessions
- **Password Security**: bcryptjs for password hashing
- **Security Middleware**: helmet for HTTP security headers
- **Rate Limiting**: express-rate-limit for API protection

### Frontend Libraries
- **UI Framework**: React with React DOM
- **Routing**: react-router-dom for navigation
- **HTTP Client**: axios for API requests
- **Charts**: chart.js with react-chartjs-2 for data visualization
- **Icons**: lucide-react for UI icons
- **PDF Generation**: jspdf and jspdf-autotable for reports

### Backend Dependencies
- **Web Framework**: Express.js for API server
- **Database ORM**: Sequelize with pg (PostgreSQL driver)
- **Middleware**: cors, morgan (logging), dotenv (environment variables)
- **Security**: JWT for token-based features (secondary auth option)

### Development Tools
- **Build System**: Vite with React plugin
- **CSS Framework**: Tailwind CSS with PostCSS and Autoprefixer
- **Development Server**: nodemon for backend hot reloading