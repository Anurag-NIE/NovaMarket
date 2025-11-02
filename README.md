# NovoMarket - Modern E-commerce Marketplace

A full-stack e-commerce marketplace built with React and FastAPI, featuring real-time messaging, payment processing, and a modern design system.

## 🚀 Tech Stack

### Frontend

- **React 19** - Modern UI framework with latest features
- **React Router DOM 7** - Client-side routing
- **Tailwind CSS 3** - Utility-first CSS framework
- **Radix UI** - Headless, accessible UI components
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API communication
- **React Hook Form + Zod** - Form handling with validation
- **Lucide React** - Beautiful icon library
- **Recharts** - Data visualization for analytics
- **Sonner** - Toast notifications
- **CRACO** - Create React App configuration override

### Backend

- **FastAPI** - High-performance Python web framework
- **MongoDB + Motor** - NoSQL database with async driver
- **JWT** - Secure authentication tokens
- **Stripe** - Payment processing integration
- **Bcrypt** - Password hashing
- **Pydantic** - Data validation and serialization
- **Uvicorn** - Lightning-fast ASGI server
- **Python-SocketIO** - Real-time messaging support

### Key Features

- 🛍️ **Multi-vendor marketplace** with buyer/seller roles
- 🔐 **JWT-based authentication** with secure password hashing
- 💳 **Stripe payment integration** with webhook support
- 💬 **Real-time messaging** between buyers and sellers
- ⭐ **Review and rating system** for products
- ❤️ **Wishlist functionality** for buyers
- 📊 **Analytics dashboard** for sellers
- 🎨 **Modern design system** with dark mode support
- 📱 **Fully responsive** mobile-first design

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download here](https://python.org/)
- **MongoDB** - [Install locally](https://docs.mongodb.com/manual/installation/) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download here](https://git-scm.com/)

## 📦 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd novomarket
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

#### Environment Configuration

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env  # If example exists, or create manually
```

Add the following environment variables to `backend/.env`:

```env
# Database
MONGO_URL=mongodb://localhost:27017/
DB_NAME=MarketPlace

# Security
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_API_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Frontend Setup

#### Install Node Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

#### Environment Configuration

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

#### Start the Frontend Development Server

```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Setup

### Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service:

   ```bash
   # macOS (with Homebrew)
   brew services start mongodb-community

   # Linux (systemd)
   sudo systemctl start mongod

   # Windows
   net start MongoDB
   ```

### MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and update `MONGO_URL` in backend `.env`

## 💳 Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Get your API keys from the [Dashboard](https://dashboard.stripe.com/apikeys)
3. Add keys to backend `.env` file
4. For webhooks:
   - Install Stripe CLI: `stripe login`
   - Forward events: `stripe listen --forward-to localhost:8000/api/webhook/stripe`
   - Copy webhook secret to `.env`

## 🚀 Development Workflow

### Running Both Services

```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
uvicorn server:app --reload

# Terminal 2 - Frontend
cd frontend
npm start
```

### Code Structure

```
novomarket/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility functions
│   ├── public/           # Static assets
│   └── package.json      # Node dependencies
└── README.md
```

## 🎨 Design System

This project uses a comprehensive design system based on:

- **Typography**: Space Grotesk (headings) + Karla (body)
- **Colors**: Ocean blue primary (#146C94) with emerald accents
- **Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React icon library

### Key Design Principles

- Mobile-first responsive design
- Accessibility compliance (WCAG AA)
- Dark mode support
- Consistent spacing and typography scale
- Subtle animations and micro-interactions

## 🧪 Testing

### Frontend Testing

```bash
cd frontend
npm test
```

### Backend Testing

```bash
cd backend
pytest
```

## 📝 API Documentation

The backend provides comprehensive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `GET /api/products` - List products with filtering
- `POST /api/products` - Create new product (sellers only)
- `POST /api/orders` - Create order
- `POST /api/checkout/session` - Create Stripe checkout session
- `GET /api/messages/threads` - Get message threads
- `POST /api/reviews` - Add product review

## 🔧 Configuration

### Frontend Configuration

- **Tailwind Config**: `frontend/tailwind.config.js`
- **CRACO Config**: `frontend/craco.config.js`
- **Component Config**: `frontend/components.json`

### Backend Configuration

- **CORS Origins**: Configure allowed origins in `.env`
- **Database**: MongoDB connection string
- **JWT**: Secret key and algorithm
- **Stripe**: API keys and webhook secrets

## 🚀 Deployment

### Frontend Deployment

```bash
cd frontend
npm run build
# Deploy the 'build' folder to your hosting service
```

### Backend Deployment

```bash
cd backend
# Install production dependencies
pip install -r requirements.txt
# Run with production ASGI server
gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Environment Variables for Production

Ensure all environment variables are properly set in your production environment, especially:

- Database connection strings
- JWT secrets
- Stripe API keys
- CORS origins

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Use meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**

- Check if MongoDB is running
- Verify environment variables in `.env`
- Ensure Python virtual environment is activated

**Frontend build errors:**

- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify environment variables

**Database connection issues:**

- Check MongoDB service status
- Verify connection string format
- Ensure database permissions

**Stripe integration issues:**

- Verify API keys are correct
- Check webhook endpoint configuration
- Ensure Stripe CLI is properly set up for local development

### Getting Help

- Check the [Issues](../../issues) page for known problems
- Review API documentation at `http://localhost:8000/docs`
- Ensure all prerequisites are properly installed

## 🔗 Useful Links

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com/)
