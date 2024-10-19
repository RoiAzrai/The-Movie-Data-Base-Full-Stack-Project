# Flask Backend
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_cors import CORS
from flask_caching import Cache
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import requests
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from flask_migrate import Migrate


app = Flask(__name__)
CORS(app)  # Enables Cross-Origin Resource Sharing (CORS) for the app

# Configurations for Flask app
app.config['SECRET_KEY'] = 'your_secret_key'  # Secret key for sessions and security
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:123456@localhost/movies_db'  # Database URI for PostgreSQL
app.config['CACHE_TYPE'] = 'simple'  # Caching configuration
app.config['CACHE_DEFAULT_TIMEOUT'] = 300  # Cache timeout in seconds (5 minutes)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'your_gmail_address@gmail.com'
app.config['MAIL_PASSWORD'] = 'your_gmail_password_or_app_password'
app.config['MAIL_DEFAULT_SENDER'] = 'your_gmail_address@gmail.com'


# Initialize extensions
cache = Cache(app)  # Initialize caching
db = SQLAlchemy(app)  # Initialize SQLAlchemy with the Flask app
login_manager = LoginManager(app)  # Initialize Flask-Login
login_manager.login_view = 'login'  # Specify the login view

# Initialize Flask-Mail for sending emails
mail = Mail(app)

# API and URLs
API_KEY = '0089358a7ddb17c0f68be19ae2759f56'
BASE_URL = 'https://api.themoviedb.org/3'
IMG_URL = 'https://image.tmdb.org/t/p/w500'

# Initialize Migrate
migrate = Migrate(app, db)

# User model for login system
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)
    favorites = db.relationship('Favorite', backref='user', lazy=True)

# Favorite movies model
class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    movie_id = db.Column(db.String(50), nullable=False)
    movie_title = db.Column(db.String(255), nullable=False)  # Add movie title
    movie_category = db.Column(db.String(255), nullable=False)  # Add movie category
    movie_year = db.Column(db.Integer, nullable=False)  # Add movie year
    movie_poster = db.Column(db.String(255), nullable=True)  # Make movie poster URL nullable
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

# Create the database if it does not exist
with app.app_context():
    db.create_all()

# Load user for Flask-Login
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Serve the main page (index.html)
@app.route('/')
def index():
    return render_template('index.html')

# Route to handle user login
@app.route('/login', methods=['POST'])
def login():
    data = request.json  # Get JSON data from the request
    username = data.get('username')
    password = data.get('password')
    
    # Check if user exists
    user = User.query.filter_by(username=username).first()

    # Validate the username and password
    if user and check_password_hash(user.password, password):
        login_user(user)  # Log in the user
        flash('Login successful.', 'success')
        return jsonify({"success": True, "message": "Login successful."})
    else:
        flash('Invalid username or password.', 'error')
        return jsonify({"error": "Invalid username or password"}), 401

# Route to handle user logout
@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True})

# Route to discover popular movies (with caching)
@app.route('/discover')
@cache.cached(timeout=300, query_string=True)  # Cache the results for 5 minutes
def discover_movies():
    print("Fetching movies from TMDB API")
    url = f'{BASE_URL}/discover/movie?sort_by=popularity.desc&api_key={API_KEY}'
    genre = request.args.get('with_genres')  # Get selected genre from query parameters
    page = request.args.get('page', 1)  # Get page number from query parameters, default to 1
    print(f"Requested Page: {page}")  # Logging page number
    url += f'&page={page}'  # Add page parameter to the URL

    if genre:
        url += f'&with_genres={genre}'
    
    # Fetch the movies from the TMDB API
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return jsonify(data)
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from TMDB API: {e}")
        return jsonify({"error": "Failed to fetch data from TMDB API"}), 500


# Route to search movies by query (with caching)
@app.route('/search')
@cache.cached(timeout=300, query_string=True)  # Cache the results for 5 minutes
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

# Route to get movie genres (with caching)
@app.route('/genres')
@cache.cached(timeout=300)  # Cache the results for 5 minutes
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

# Route to check if a movie is in user's favorites
@app.route('/is_favorite/<int:movie_id>', methods=['GET'])
@login_required
def is_favorite(movie_id):
    favorite = Favorite.query.filter_by(movie_id=str(movie_id), user_id=current_user.id).first()
    if favorite:
        return jsonify({"is_favorite": True})
    return jsonify({"is_favorite": False})

# Route to add a movie to favorites
@app.route('/add_favorite', methods=['POST'])
@login_required
def add_favorite():
    data = request.json
    movie_id = data.get('movie_id')

    # Fetch the movie details from TMDB to get the correct category and year
    if movie_id:
        movie_details_url = f"{BASE_URL}/movie/{movie_id}?api_key={API_KEY}"
        try:
            response = requests.get(movie_details_url)
            response.raise_for_status()
            movie_data = response.json()
            movie_title = movie_data.get('title', 'Unknown Title')
            movie_category = movie_data.get('genres', [{'name': 'Unknown Category'}])[0]['name']
            movie_year = movie_data.get('release_date', '0000')[:4]  # Extract year from release_date
            movie_poster = movie_data.get('poster_path', '')  # Extract poster path
            
            # Check if the movie is already in the user's favorites
            existing_favorite = Favorite.query.filter_by(movie_id=movie_id, user_id=current_user.id).first()
            if existing_favorite:
                return jsonify({"error": "Movie already in favorites"}), 400

            # Add new favorite to the database
            new_favorite = Favorite(
                movie_id=movie_id,
                movie_title=movie_title,
                movie_category=movie_category,
                movie_year=int(movie_year),
                movie_poster=movie_poster,
                user_id=current_user.id
            )
            db.session.add(new_favorite)
            db.session.commit()
            return jsonify({"success": "Movie added to favorites"})
        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching movie details from TMDB API: {e}")
            return jsonify({"error": "Failed to fetch movie details"}), 500

    return jsonify({"error": "Movie ID is required"}), 400

# Route to get user favorites
@app.route('/favorites')
@login_required
def get_favorites():
    user_favorites = Favorite.query.filter_by(user_id=current_user.id).all()
    favorites_list = []

    for fav in user_favorites:
        movie_details_url = f"{BASE_URL}/movie/{fav.movie_id}?api_key={API_KEY}"
        try:
            response = requests.get(movie_details_url)
            response.raise_for_status()
            movie_data = response.json()
            overview = movie_data.get('overview', 'Overview not available')

            favorites_list.append({
                'movie_id': fav.movie_id,
                'title': fav.movie_title,
                'category': fav.movie_category,
                'year': fav.movie_year,
                'poster_path': f'{IMG_URL}{fav.movie_poster}',
                'overview': overview,
                'vote_average': movie_data.get('vote_average', 'N/A')
            })
        except requests.exceptions.RequestException as e:
            print(f"Error fetching movie details from TMDB API: {e}")
            return jsonify({"error": "Failed to fetch movie details"}), 500

    return jsonify(favorites_list)




# Route for user registration (sign-up)
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    # Check if username or email already exists
    if User.query.filter_by(username=username).first() or User.query.filter_by(email=email).first():
        flash('Username or email already exists.', 'error')
        return jsonify({'success': False, 'message': 'Username or email already exists.'}), 400

    # Hash the password for secure storage
    hashed_password = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)

    # Create a new user
    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    # Send confirmation email to the new user
    try:
        send_confirmation_email(email)
    except Exception as e:
        flash('Failed to send confirmation email.', 'error')
        return jsonify({'success': False, 'message': 'Failed to send confirmation email.'}), 500

    flash('User registered successfully.', 'success')
    return jsonify({'success': True, 'message': 'User registered successfully.'}), 201

# Route to remove a movie from favorites
@app.route('/remove_favorite', methods=['POST'])
@login_required
def remove_favorite():
    data = request.json
    movie_id = data.get('movie_id')

    if movie_id:
        # Find the favorite entry for the current user and given movie_id
        favorite = Favorite.query.filter_by(movie_id=str(movie_id), user_id=current_user.id).first()
        if favorite:
            db.session.delete(favorite)
            db.session.commit()
            return jsonify({"success": True, "message": "Movie removed from favorites"})
        else:
            return jsonify({"error": "Favorite movie not found"}), 404
    return jsonify({"error": "Movie ID is required"}), 400

# Function to send a confirmation email
def send_confirmation_email(email):
    msg = Message('Welcome to Movie App!', recipients=[email])
    msg.body = 'Thank you for signing up for our movie app! Enjoy exploring our features.'
    mail.send(msg)

# Create the database if it does not exist
with app.app_context():
    db.create_all()

@app.route('/is_logged_in')
def is_logged_in():
    if current_user.is_authenticated:
        return jsonify({'is_logged_in': True, 'username': current_user.username})
    return jsonify({'is_logged_in': False})

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)
