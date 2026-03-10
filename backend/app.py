from flask import Flask, jsonify, request
from flask_cors import CORS
import bcrypt
import jwt
import os
import datetime
from supabase import create_client

app = Flask(__name__)
CORS(app)

# ── Supabase client ───────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
JWT_SECRET   = os.environ.get('JWT_SECRET', 'change-this-secret')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Helper: create JWT token ──────────────────────────────────────────────────
def make_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email':   email,
        'exp':     datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

# ── Helper: verify JWT token ──────────────────────────────────────────────────
def verify_token(request):
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    token = auth.split(' ')[1]
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/hello')
def hello():
    return jsonify({'message': 'Hello from Flask!'})

# ── Signup ────────────────────────────────────────────────────────────────────
@app.route('/api/signup', methods=['POST'])
def signup():
    data     = request.get_json()
    name     = data.get('name', '').strip()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = supabase.table('users').select('id').eq('email', email).execute()
    if existing.data:
        return jsonify({'error': 'Email already registered'}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    result = supabase.table('users').insert({
        'name':          name,
        'email':         email,
        'password_hash': password_hash
    }).execute()

    user  = result.data[0]
    token = make_token(user['id'], user['email'])

    return jsonify({
        'message': 'Account created successfully',
        'token':   token,
        'user':    {'id': user['id'], 'name': user['name'], 'email': user['email']}
    }), 201

# ── Login ─────────────────────────────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    data     = request.get_json()
    email    = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    result = supabase.table('users').select('*').eq('email', email).execute()
    if not result.data:
        return jsonify({'error': 'Invalid email or password'}), 401

    user = result.data[0]

    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Invalid email or password'}), 401

    token = make_token(user['id'], user['email'])

    return jsonify({
        'message': 'Login successful',
        'token':   token,
        'user':    {'id': user['id'], 'name': user['name'], 'email': user['email']}
    })

# ── Protected: get current user ───────────────────────────────────────────────
@app.route('/api/me')
def me():
    payload = verify_token(request)
    if not payload:
        return jsonify({'error': 'Not logged in'}), 401

    result = supabase.table('users').select('id, name, email').eq('id', payload['user_id']).execute()
    if not result.data:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({'user': result.data[0]})

if __name__ == '__main__':
    app.run(debug=True)
