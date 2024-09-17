# Flask Backend
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS  # Import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for the entire Flask app

API_KEY = '0089358a7ddb17c0f68be19ae2759f56'
BASE_URL = 'https://api.themoviedb.org/3'
IMG_URL = 'https://image.tmdb.org/t/p/w500'


# Serve the index.html
@app.route('/')
def index():
    return render_template('index.html')


# Route to discover popular movies
@app.route('/discover')
def discover_movies():
    url = f'{BASE_URL}/discover/movie?sort_by=popularity.desc&api_key={API_KEY}'
    genre = request.args.get('with_genres')  # Get selected genre from query parameters
    page = request.args.get('page', 1)  # Get page number from query parameters, default to 1
    url += f'&page={page}'  # Add page parameter to the URL

    if genre:
        url += f'&with_genres={genre}'
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from TMDB API: {e}")
        return jsonify({"error": "Failed to fetch data from TMDB API"}), 500



# Route to search movies by query
@app.route('/search')
def search_movie():
    query = request.args.get('query', '')
    url = f'{BASE_URL}/search/movie?api_key={API_KEY}&query={query}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching movies from TMDB API: {e}")
        return jsonify({"error": "Failed to search movies"}), 500


# Route to get movie genres
@app.route('/genres')
def get_genres():
    url = f'{BASE_URL}/genre/movie/list?api_key={API_KEY}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return jsonify(data['genres'])
    except requests.exceptions.RequestException as e:
        print(f"Error fetching genres from TMDB API: {e}")
        return jsonify({"error": "Failed to fetch genres"}), 500


if __name__ == '__main__':
    app.run(debug=True)
