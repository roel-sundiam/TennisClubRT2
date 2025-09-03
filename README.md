# Tennis Club RT2 - Court Reservation System

A modern, mobile-friendly Progressive Web App for tennis court reservations with senior-friendly design.

## Features

- **User Management**: Registration, approval system, profile management
- **Court Reservations**: Schedule courts with weather forecasts
- **Payment System**: Coin-based system with dynamic fee calculation
- **Admin Features**: User approval, payment reports, site analytics
- **Communication**: Polls, suggestions/complaints system
- **Accessibility**: Senior-friendly design with high contrast and large fonts

## Tech Stack

- **Frontend**: Angular 17+ with PWA capabilities
- **Backend**: Express.js with TypeScript
- **Database**: MongoDB
- **APIs**: OpenWeather API for weather forecasts

## Project Structure

```
├── frontend/          # Angular PWA application
├── backend/           # Express.js API server
├── shared/            # Shared TypeScript interfaces
└── docs/              # Project documentation
```

## Getting Started

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ng serve
   ```

## Environment Variables

Create `.env` files in both frontend and backend directories with:

- MongoDB connection string
- OpenWeather API key
- JWT secret
- Other configuration variables

## Design Principles

- **Senior-Friendly**: Large fonts, high contrast, simple navigation
- **Mobile-First**: Responsive design optimized for mobile devices
- **Professional**: Modern, clean interface with accessibility focus
- **Progressive**: PWA capabilities for offline use and mobile installation