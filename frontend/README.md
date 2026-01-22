# Blogging Frontend

Angular frontend application for the blogging platform.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Angular CLI

## Installation

```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Install dependencies
npm install
```

## Configuration

Update the API URL in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api", // Your backend URL
};
```

## Development Server

Run the development server:

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Build

Build the project for production:

```bash
npm run build
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
src/
├── app/
│   ├── components/          # UI Components
│   │   ├── blog-list/      # List all blogs
│   │   ├── blog-detail/    # Blog detail with comments
│   │   ├── blog-create/    # Create new blog
│   │   ├── login/          # Login page
│   │   ├── register/       # Registration page
│   │   ├── header/         # Header navigation
│   │   └── footer/         # Footer
│   ├── services/           # API Services
│   │   ├── auth.service.ts
│   │   ├── blog.service.ts
│   │   ├── comment.service.ts
│   │   ├── like.service.ts
│   │   └── user.service.ts
│   ├── models/             # TypeScript interfaces
│   ├── guards/             # Route guards
│   ├── interceptors/       # HTTP interceptors
│   └── app.routes.ts       # Routing configuration
├── environments/           # Environment configs
└── assets/                # Static assets
```

## Features

- ✅ User authentication (register, login, logout)
- ✅ Create, read, update, delete blog posts
- ✅ Like/unlike blog posts
- ✅ Comment on blog posts
- ✅ View user profiles
- ✅ Responsive design
- ✅ Protected routes with auth guards
- ✅ HTTP interceptor for authentication

## API Integration

The frontend connects to your backend API at the configured URL. Make sure:

1. Backend server is running
2. CORS is enabled on the backend
3. API URL is correctly configured in environment files

## Available Routes

- `/` - Home page (blog list)
- `/login` - Login page
- `/register` - Registration page
- `/blog/create` - Create new blog (protected)
- `/blog/:id` - Blog detail page

## Running Tests

```bash
npm test
```

## Additional Commands

```bash
# Watch mode for development
npm run watch

# Code scaffolding
ng generate component component-name
ng generate service service-name
```
