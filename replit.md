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
- June 26, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.