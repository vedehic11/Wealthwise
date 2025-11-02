"""
Vercel serverless function adapter for Flask backend
This file makes the Flask app compatible with Vercel's serverless functions
"""

import sys
import os

# Add backend directory to path so imports work
backend_path = os.path.join(os.path.dirname(__file__), '..', 'backend')
sys.path.insert(0, os.path.abspath(backend_path))

# Import the Flask app
from app import app

# Use mangum to convert Flask WSGI to ASGI for Vercel
from mangum import Mangum

# Create a wrapper to handle /api prefix stripping
class StripPathMiddleware:
    """Middleware to strip /api prefix from requests"""
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        # Strip /api prefix from PATH_INFO if present
        path_info = environ.get('PATH_INFO', '')
        if path_info.startswith('/api'):
            environ['PATH_INFO'] = path_info[4:] or '/'
            environ['SCRIPT_NAME'] = environ.get('SCRIPT_NAME', '') + '/api'
        return self.app(environ, start_response)

# Wrap the Flask app with middleware
wrapped_app = StripPathMiddleware(app)

# Create the handler - this is what Vercel will call
handler = Mangum(wrapped_app)

