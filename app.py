from flask import Flask, request, jsonify
from flask_cors import CORS
from rec import get_similar_movies

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    movie_name = request.args.get('movie_name')
    if not movie_name:
        return jsonify({"error": "Movie name is required"}), 400
    
    try:
        recommendations = get_similar_movies(movie_name)
        return jsonify({"recommendations": recommendations})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True) 