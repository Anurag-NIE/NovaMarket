# backend/config.py
"""
Configuration management for NovoMarket backend
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class Settings:
    """Application settings"""
    
    # Application
    APP_NAME = "NovoMarket API"
    APP_VERSION = "2.0.0"
    DEBUG = os.getenv("DEBUG", "False") == "True"
    
    # Database
    MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
    DB_NAME = os.environ.get('DB_NAME', 'novomarket')
    
    # Security
    JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
    JWT_EXPIRATION_DAYS = int(os.getenv('JWT_EXPIRATION_DAYS', '7'))
    
    # Stripe
    STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    # Email (Optional)
    SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
    SMTP_USER = os.getenv('SMTP_USER')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@novomarket.com')
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    
    # File Upload
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR = ROOT_DIR / "uploads"
    
    # Frontend URL
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    
    @classmethod
    def validate(cls):
        """Validate required settings"""
        required = ['MONGO_URL', 'JWT_SECRET']
        missing = [key for key in required if not getattr(cls, key)]
        if missing:
            raise ValueError(f"Missing required settings: {', '.join(missing)}")

# Create settings instance
settings = Settings()

# Validate on import
settings.validate()

# Create upload directory
settings.UPLOAD_DIR.mkdir(exist_ok=True)