from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allows React frontend to call this API

@app.route('/health')
def health():
    return jsonify({ 'status': 'ok' })

@app.route('/api/hello')
def hello():
    return jsonify({ 'message': 'Hello from Flask!' })

@app.route('/api/items')
def items():
    return jsonify({
        'items': [
            { 'id': 1, 'name': 'Item One' },
            { 'id': 2, 'name': 'Item Two' },
            { 'id': 3, 'name': 'Item Three' },
        ]
    })

if __name__ == '__main__':
    app.run(debug=True)
