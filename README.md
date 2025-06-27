# Ayurvedic Hospital Management System

A comprehensive full-stack web application for managing Ayurvedic medical practices with patient records, appointments, prescriptions, payments, and administrative features.

## Features

- **Patient Management**: Complete patient profiles with Ayurvedic constitution tracking
- **Appointment Scheduling**: Calendar-based appointment system with status management
- **Prescription Management**: Digital prescription creation and tracking
- **Payment Processing**: Transaction tracking and payment status management
- **Admin Dashboard**: Comprehensive analytics and user management
- **Role-based Access**: Doctor, staff, and admin user roles
- **Mobile Responsive**: Fully optimized for mobile devices
- **Activity Logging**: Complete audit trail for user activities

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with role management
- **Deployment**: Replit-ready with autoscale support

## Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/ayurvedic-hospital-management.git
   cd ayurvedic-hospital-management
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   Create a `.env` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_secure_session_secret
   ```

4. **Set up the database**:
   ```bash
   npm run db:push
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open your browser to `http://localhost:5000`

## Deployment on Replit

This project is optimized for Replit deployment:

1. Import this repository to Replit
2. Replit will automatically detect dependencies and install them
3. Configure environment variables in Replit Secrets
4. Run the project using the "Start application" workflow
5. Use Replit Deployments for production hosting

## Deployment to Personal GitHub Repository

### Step 1: Create a new GitHub repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., `ayurvedic-hospital-management`)
5. Make it public or private as needed
6. Don't initialize with README (we already have one)
7. Click "Create repository"

### Step 2: Push your code from Replit

In the Replit Shell, run these commands:

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Ayurvedic Hospital Management System"

# Add your GitHub repository as remote origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name.

### Step 3: Set up deployment secrets

If deploying elsewhere, ensure these environment variables are set:
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secure random string for session encryption

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database operations
│   └── db.ts             # Database connection
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema definitions
└── README.md             # This file
```

## Database Schema

The system includes tables for:
- Users (doctors, staff, admin)
- Patients with Ayurvedic constitution tracking
- Appointments with scheduling
- Prescriptions with medication details
- Payments with transaction tracking
- User login logs for audit trails

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please create an issue in the GitHub repository or contact the development team.