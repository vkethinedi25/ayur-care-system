# Ayurvedic Practice Management System

## Overview

This is a full-stack web application designed for managing an Ayurvedic medical practice. The system provides comprehensive functionality for patient management, appointment scheduling, prescription handling, payment processing, and practice analytics. Built with modern web technologies, it offers a clean, intuitive interface for healthcare professionals to efficiently manage their practice operations.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Ayurvedic theme colors
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **File Handling**: Multer for prescription and document uploads
- **Session Management**: Express sessions with PostgreSQL store

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages/views
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Backend Express application
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Database operations layer
│   └── db.ts             # Database connection setup
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── migrations/           # Database migration files
```

## Key Components

### Database Schema
The system uses a comprehensive PostgreSQL schema with the following main entities:
- **Users**: Healthcare professionals with role-based access (admin, doctor, staff)
- **Patients**: Complete patient profiles with Ayurvedic constitution (Prakriti/Vikriti)
- **Appointments**: Scheduling system with status tracking
- **Prescriptions**: Digital prescription management with medication details
- **Payments**: Financial transaction tracking with multiple payment methods
- **Bed Management**: Inpatient care facility management
- **Inpatient Records**: Detailed records for hospitalized patients

### User Interface
- **Dashboard**: Comprehensive overview with metrics, recent patients, and today's schedule
- **Patient Management**: Full CRUD operations for patient records with search functionality
- **Appointment System**: Calendar-based scheduling with status management
- **Prescription Module**: Digital prescription creation and management
- **Payment Processing**: Transaction tracking and payment status management
- **Reports**: Analytics and reporting capabilities

### Authentication & Authorization
- Mock authentication system (development phase)
- Role-based access control (admin, doctor, staff)
- Session-based authentication with secure cookie handling

## Data Flow

### Client-Server Communication
1. **API Layer**: RESTful endpoints for all CRUD operations
2. **Query Management**: TanStack Query handles caching, synchronization, and optimistic updates
3. **Form Validation**: Zod schemas ensure data integrity at both client and server levels
4. **Error Handling**: Comprehensive error boundaries and user feedback

### Database Operations
1. **Type Safety**: Drizzle ORM provides end-to-end type safety
2. **Schema Validation**: Zod integration with Drizzle for runtime validation
3. **Connection Management**: Serverless-optimized connection pooling
4. **Migration System**: Version-controlled database schema changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety and enhanced developer experience
- **ESLint/Prettier**: Code quality and formatting
- **Replit integration**: Cloud development environment support

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite provides instant feedback during development
- **Type Checking**: Real-time TypeScript validation
- **Database**: Local PostgreSQL or Neon serverless database

### Production Build
- **Frontend**: Static asset generation with Vite
- **Backend**: Node.js server bundle with esbuild
- **Database**: PostgreSQL with connection pooling
- **Deployment Target**: Replit autoscale deployment

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **NODE_ENV**: Environment-specific configurations
- **File Storage**: Local uploads directory with configurable limits

## Changelog
- June 27, 2025. Complete mobile-responsive design implementation:
  - Redesigned sidebar navigation with mobile-friendly drawer/sheet component using hamburger menu
  - Added responsive top navigation bar for mobile devices with collapsible search functionality
  - Implemented dual-view layout system (desktop table view and mobile card view) for all data-heavy pages
  - Enhanced Patients, Appointments, and Prescriptions pages with mobile-optimized card layouts
  - Updated form components (PatientForm, AppointmentForm) with responsive grid layouts and mobile-friendly dialogs
  - Improved TopBar component with responsive search and notification functionality
  - Added proper spacing and padding adjustments for mobile devices (pt-16 on mobile, lg:pt-0 on desktop)
  - Ensured all UI components scale appropriately across device sizes using Tailwind responsive breakpoints
  - Complete mobile compatibility achieved with touch-friendly interfaces and optimized user experience
- June 27, 2025. Production-ready authentication system deployment fixes:
  - Enhanced session management with custom session naming and improved persistence mechanisms
  - Added comprehensive debug logging for deployment troubleshooting and session state monitoring
  - Configured trust proxy settings and secure cookie handling for production deployment environments
  - Improved authentication middleware with better error handling and session validation
  - Enhanced client-side authentication with fresh state checks and improved error recovery
  - Fixed session persistence issues that could occur in deployment environments
  - Authentication system now fully ready for production deployment with robust session management
- June 27, 2025. Admin user login logging system implementation:
  - Created comprehensive user login tracking with location data capture
  - Added new database table (user_login_logs) for storing login attempts, IP addresses, user agents, and location details
  - Implemented admin-only API endpoints for viewing all user login history and individual user login details
  - Built AdminLogs page with filtering capabilities by status (success/failed/locked) and user-specific search
  - Enhanced sidebar navigation with admin-only "Login Logs" section for security monitoring
  - Added automatic login tracking for successful, failed, and locked account attempts
  - Database schema includes jsonb location field for flexible geographic data storage
- June 27, 2025. Complete doctor-based data isolation implementation:
  - Implemented comprehensive security enhancement across ALL pages and API endpoints
  - Added authentication requirements to all sensitive endpoints (dashboard, appointments, prescriptions, payments)
  - Enhanced storage interface with doctorId filtering parameter for all data types
  - Updated all dashboard endpoints to filter by logged-in doctor (stats, recent patients, today's appointments)
  - Modified appointments, prescriptions, and payments APIs to only show doctor's own data
  - Complete data privacy implementation - doctors can only see their own patients, appointments, prescriptions, and payments
  - Database structure ensures complete isolation between different doctors' data
- June 27, 2025. Doctor-based patient filtering implementation:
  - Added doctorId column to patients table with foreign key reference to users
  - Modified patient API endpoint to filter patients by the doctor who added them
  - Enhanced getPatients method to support doctor-based filtering with search functionality
  - Updated database structure to ensure data privacy between doctors
  - Each doctor now only sees patients they personally added to the system
- June 27, 2025. Security enhancements and patient ID system implementation:
  - Removed demo credentials from login page for production deployment
  - Implemented doctor-based patient ID generation (e.g., DR.K1, DR.K2)
  - Enhanced search functionality to include patient ID searches
  - Fixed logout functionality with proper session management
  - Set 30-minute session timeout for enhanced security
- June 26, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.