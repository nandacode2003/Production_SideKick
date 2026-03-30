import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from matching import compute_matches

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "sidekick-matching"})

@app.route('/match', methods=['POST'])
def match():
    data = request.get_json()
    if not data or 'user' not in data or 'candidates' not in data:
        return jsonify({"error": "Invalid payload. Requires 'user' and 'candidates'."}), 400
    try:
        results = compute_matches(data['user'], data['candidates'])
        return jsonify({"results": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
