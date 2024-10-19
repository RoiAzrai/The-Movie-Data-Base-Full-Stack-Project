const BASE_URL = 'http://localhost:5000';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_MOVIE_URL = 'https://www.themoviedb.org/movie/';
const main = document.getElementById('main');
const form = document.getElementById('form');
const search = document.getElementById('search');
const categoriesContainer = document.getElementById('categories-container');
const autocompleteContainer = document.createElement('div');
const currentPageDisplay = document.getElementById('current');
const prevPageButton = document.getElementById('prev');
const nextPageButton = document.getElementById('next');
const signupModal = document.getElementById('signup-modal');
const loginModal = document.getElementById('login-modal');
const signupForm = document.getElementById('signup-form');
const closeSignupModal = document.getElementById('close-signup-modal');
const closeLoginModal = document.getElementById('close-login-modal');
const signupBtn = document.getElementById('signup-btn');
const loginBtn = document.getElementById('login-btn');
const loginForm = document.getElementById('login-form');
const userName = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');
const favoritesBtn = document.createElement('button');

let currentPage = 1;
let currentUrl = '';
let totalPages = 1;
//let isNavigating = false;
let isFavoritesPage = false;
let cachedFavorites = null;

autocompleteContainer.classList.add('autocomplete-container');
search.parentNode.appendChild(autocompleteContainer);

favoritesBtn.textContent = 'Favorites';
favoritesBtn.classList.add('auth-btn');
favoritesBtn.style.display = 'none';
userName.parentNode.insertBefore(favoritesBtn, userName.nextSibling);

// Function to show flash messages
function showFlashMessage(message, category) {
    const flashWrapper = document.getElementById('flash-wrapper');
    const flashMessage = document.getElementById('flash-messages');

    // Set the message and category
    flashMessage.textContent = message;
    flashMessage.className = `flash-message ${category}`;

    // Show the flash message
    flashWrapper.style.display = 'flex';

    // Remove flash message after 3 seconds
    setTimeout(() => {
        flashWrapper.style.display = 'none';
    }, 1500);
}

// Function to handle login/logout button display and user dropdown menu
function updateAuthButtons() {
    fetch('/is_logged_in', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
    .then(data => {
        if (data.is_logged_in) {
            // If user is logged in, show username, logout button, and favorites button
            userName.textContent = data.username;
            userName.style.display = 'inline-block';
            logoutBtn.style.display = 'inline-block';
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            favoritesBtn.style.display = 'inline-block';

            // Add event listener for logout
            logoutBtn.onclick = function() {
                fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if (response.ok) {
                        showFlashMessage('Logout successful', 'success');
                        updateAuthButtons();
                        location.reload(); //
                    }
                });
            };
            

            // Load favorites when clicking on the favorites button
            // Handle Favorites button click event
            favoritesBtn.onclick = function() {
                const searchContainer = document.querySelector('.search-container');
                const categoriesContainer = document.getElementById('categories-container');
                const favoritesTitleContainer = document.getElementById('favorites-title-container');
            
                if (isFavoritesPage) {
                    location.reload(); // Refresh the page to reset everything to default
                    // Go back to the main page
                    getMovies(`${BASE_URL}/discover`);
                    isFavoritesPage = false;
                    searchContainer.style.display = 'flex';
                    categoriesContainer.style.display = 'block';
                    favoritesTitleContainer.style.display = 'none';
                    // Show pagination controls when returning to the main page
                    prevPageButton.style.display = 'inline-block';
                    nextPageButton.style.display = 'inline-block';
                    currentPageDisplay.style.display = 'inline-block';
                    // Restore the categories container alignment
                    categoriesContainer.style.justifyContent = 'center';
                } else {
                    // Go to the Favorites page and always reload favorites from the server
                    loadFavorites();
                    isFavoritesPage = true;
                    searchContainer.style.display = 'none';
                    categoriesContainer.style.display = 'none';
                    favoritesTitleContainer.style.display = 'block';
                    // Hide pagination controls on the favorites page
                    prevPageButton.style.display = 'none';
                    nextPageButton.style.display = 'none';
                    currentPageDisplay.style.display = 'none';
                }
            };
            
            

        } else {
            // If user is not logged in, show login and join buttons
            userName.style.display = 'none';
            logoutBtn.style.display = 'none';
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            favoritesBtn.style.display = 'none';
        }
    });
}

// Initialize the auth buttons on page load
document.addEventListener('DOMContentLoaded', updateAuthButtons);

// Handle signup form submission
signupForm.onsubmit = function(event) {
    event.preventDefault();

    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    if (password !== passwordConfirm) {
        showFlashMessage('Passwords do not match', 'error');
        return;
    }

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            showFlashMessage('Registration successful', 'success');
            signupModal.style.display = 'none';
            updateAuthButtons();
        } else {
            showFlashMessage(data.message, 'error');
        }
    });
};

// Handle login form submission
loginForm.onsubmit = function(event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            showFlashMessage('Login successful', 'success');
            updateAuthButtons();
            loginModal.style.display = 'none';
            location.reload(); // 
        } else {
            showFlashMessage(data.error, 'error');
        }
    });
};


// Function to load favorite movies
function loadFavorites() {
    fetch('/favorites')
        .then(response => response.json())
        .then(data => {
            cachedFavorites = data; // Cache the favorites data
            displayFavorites(data);
        })
        .catch(err => {
            console.error('Error fetching favorites:', err);
            main.innerHTML = '<h1 class="error">Error loading favorites</h1>';
        });
}

// Function to display favorite movies
function displayFavorites(data) {
    main.innerHTML = '';  // Clear the main content of the page

    // Create and add the title element
    const title = document.createElement('h1');
    title.textContent = '';  // Set the text for the title
    title.classList.add('favorites-title'); // Add a class to the title for styling
    main.appendChild(title);  // Append the title to the main content

    // Add CSS styling to center the title and add spacing
    title.style.textAlign = 'center'; // Center align the title
    title.style.marginBottom = '20px'; // Add space of 20 pixels between the title and the movies

    if (data.length === 0) {
        // If there are no favorite movies, display a message indicating this
        const noFavoritesMessage = document.createElement('h1');
        noFavoritesMessage.textContent = 'No Favorites Added Yet';  // Message text for no favorites
        noFavoritesMessage.classList.add('no-results');  // Add a class for styling the message
        noFavoritesMessage.style.textAlign = 'center'; // Center align the no favorites message
        main.appendChild(noFavoritesMessage);  // Append the message to the main content
    } else {
        // Loop through each movie in the favorites data and append them directly to `main`
        data.forEach(movie => {
            const { title, poster_path, vote_average, overview, movie_id } = movie;

            // Create a container for each movie
            const movieEl = document.createElement('div');
            movieEl.classList.add('movie'); // Add a class for styling the movie element

            // Create the HTML structure for each movie
            let movieHTML = `
                <img src="${poster_path ? poster_path : 'http://via.placeholder.com/1080x1580'}" alt="${title}">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <span class="${getColor(vote_average)}">${vote_average}</span>
                </div>
                <div class="overview">
                    <h3>Overview</h3>
                    ${overview}
                    <br/> 
                    <a href="${TMDB_MOVIE_URL + movie_id}" target="_blank" class="know-more">Know More</a>
            `;

            // Add a "favorite" button for each movie
            movieHTML += `
                <button class="favorite-btn pressed" data-movie-id="${movie_id}">
                    <i class="heart-icon fa-solid fa-heart"></i>
                </button>
            `;

            movieHTML += `</div>`; // Close the overview div
            movieEl.innerHTML = movieHTML;  // Set the inner HTML for the movie container

            // Append each movie element directly to the main container
            main.appendChild(movieEl);
        });
    }
}


// Fetch genres and create radio buttons for each category
function getGenres() {
    fetch(BASE_URL + '/genres')
        .then(res => res.json())
        .then(data => {
            createCategoryButtons(data);
        })
        .catch(err => {
            console.error("Error fetching genres:", err);
        });
}

// Create autocomplete suggestions
function showAutocompleteSuggestions(suggestions) {
    autocompleteContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
        const suggestionEl = document.createElement('div');
        suggestionEl.classList.add('autocomplete-suggestion');
        suggestionEl.textContent = suggestion.title;
        suggestionEl.onclick = () => {
            search.value = suggestion.title;
            autocompleteContainer.innerHTML = '';
            currentPage = 1;
            getMovies(`${BASE_URL}/search?query=${suggestion.title}`);
        };
        autocompleteContainer.appendChild(suggestionEl);
    });
}

// Fetch movies for autocomplete
function fetchAutocomplete(query) {
    if (!query) {
        autocompleteContainer.innerHTML = '';
        return;
    }
    fetch(`${BASE_URL}/search?query=${query}`)
        .then(res => res.json())
        .then(data => {
            if (data.results) {
                showAutocompleteSuggestions(data.results.slice(0, 5));
            }
        })
        .catch(err => {
            console.error("Error fetching autocomplete:", err);
        });
}

// Create radio buttons for categories
function createCategoryButtons(genres) {
    categoriesContainer.innerHTML = `
        <label class="category selected">
            <input type="radio" name="category" value="" checked>
            Trending
        </label>
    `;
    genres.forEach(genre => {
        const radioButton = document.createElement('label');
        radioButton.classList.add('category');
        radioButton.innerHTML = `
            <input type="radio" name="category" value="${genre.id}">
            ${genre.name}
        `;
        categoriesContainer.appendChild(radioButton);
    });

    categoriesContainer.addEventListener('change', (e) => {
        const genreId = e.target.value;
        updateCategorySelection(e.target.parentElement);
        autocompleteContainer.innerHTML = '';
        currentPage = 1;
        if (genreId) {
            getMovies(`${BASE_URL}/discover?with_genres=${genreId}`);
        } else {
            getMovies(`${BASE_URL}/discover`);
        }
    });
}

// Update category selection UI
function updateCategorySelection(selectedCategory) {
    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        category.classList.remove('selected');
    });
    selectedCategory.classList.add('selected');
}

// Fetch movies from the backend
function getMovies(url, page = 1) {
    currentUrl = url;
    const separator = url.includes('?') ? '&' : '?';

    fetch(`${url}${separator}page=${page}`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length !== 0) {
                showMovies(data.results);
                updatePagination(page, data.total_pages);
                totalPages = data.total_pages; // Set totalPages to the number of pages from the response
                currentPage = page; // Update the currentPage after fetching movies successfully
            } else {
                main.innerHTML = `<h1 class="no-results">No Results Found</h1>`;
            }
        })
        .catch(err => {
            console.error("Error fetching movies:", err);
            main.innerHTML = `<h1 class="error">Error fetching movies</h1>`;
        });
}


function showMovies(data) {
    main.innerHTML = '';

    fetch('/is_logged_in', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
    .then(loginData => {
        data.forEach(movie => {
            const { title, poster_path, vote_average, overview, id } = movie;
            const movieEl = document.createElement('div');
            movieEl.classList.add('movie');

            let movieHTML = `
                <img src="${poster_path ? IMG_URL + poster_path : 'http://via.placeholder.com/1080x1580'}" alt="${title}">
                <div class="movie-info">
                    <h3>${title}</h3>
                    <span class="${getColor(vote_average)}">${vote_average}</span>
                </div>
                <div class="overview">
                    <h3>Overview</h3>
                    ${overview}
                    <br/> 
                    <a href="${TMDB_MOVIE_URL + id}" target="_blank" class="know-more">Know More</a>
            `;

            if (loginData.is_logged_in) {
                fetch(`/is_favorite/${id}`)
                .then(res => res.json())
                .then(favData => {
                    movieHTML += `
                        <button class="favorite-btn ${favData.is_favorite ? 'pressed' : ''}" data-movie-id="${id}">
                            <i class="heart-icon ${favData.is_favorite ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                        </button>
                    `;
                    movieHTML += `</div>`;
                    movieEl.innerHTML = movieHTML;
                    main.appendChild(movieEl);
                });
            } else {
                movieHTML += `</div>`;
                movieEl.innerHTML = movieHTML;
                main.appendChild(movieEl);
            }
        });
    });
}

function getColor(vote) {
    if (vote >= 8) {
        return 'green';
    } else if (vote >= 5) {
        return 'orange';
    } else {
        return 'red';
    }
}

// Update pagination UI function
function updatePagination(currentPage, totalPages) {
    currentPageDisplay.textContent = currentPage;

    // Enable or disable previous page button
    if (currentPage > 1) {
        prevPageButton.classList.remove('disabled');
        prevPageButton.disabled = false;
    } else {
        prevPageButton.classList.add('disabled');
        prevPageButton.disabled = true;
    }

    // Enable or disable next page button
    if (currentPage < totalPages) {
        nextPageButton.classList.remove('disabled');
        nextPageButton.disabled = false;
    } else {
        nextPageButton.classList.add('disabled');
        nextPageButton.disabled = true;
    }
}

// Add event listener for previous page button
prevPageButton.addEventListener('click', () => {
    if (currentPage > 1) {
        console.log(`Navigating to previous page: ${currentPage - 1}`); // Added log for debugging
        currentPage--;
        getMovies(currentUrl, currentPage);
    }
});

// Add event listener for next page button
nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
        console.log(`Navigating to next page: ${currentPage + 1}`); // Added log for debugging
        currentPage++;
        getMovies(currentUrl, currentPage);
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value.trim();
    currentPage = 1;
    if (searchTerm) {
        getMovies(`${BASE_URL}/search?query=${searchTerm}`);
    } else {
        getMovies(`${BASE_URL}/discover`);
        resetToTrending();
    }
});

function resetToTrending() {
    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        category.classList.remove('selected');
    });
    const trendingCategory = document.querySelector('.category input[value=""]');
    if (trendingCategory) {
        trendingCategory.parentElement.classList.add('selected');
        trendingCategory.checked = true;
    }
}

search.addEventListener('input', (e) => {
    fetchAutocomplete(e.target.value);
});

signupBtn.addEventListener('click', () => {
    signupModal.style.display = 'block';
});

closeSignupModal.addEventListener('click', () => {
    signupModal.style.display = 'none';
});

loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
});

closeLoginModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == signupModal) {
        signupModal.style.display = 'none';
    }
    if (event.target == loginModal) {
        loginModal.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    main.addEventListener('click', function (event) {
        if (event.target.classList.contains('heart-icon')) {
            const favoriteButton = event.target.closest('.favorite-btn');
            const movieId = favoriteButton.dataset.movieId;

            if (movieId) {
                if (favoriteButton.classList.contains('pressed')) {
                    fetch('/remove_favorite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            movie_id: movieId
                        })
                    }).then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            favoriteButton.classList.remove('pressed');
                            event.target.classList.remove('fa-solid');
                            event.target.classList.add('fa-regular');
                        }
                    });
                } else {
                    fetch('/add_favorite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            movie_id: movieId,
                            movie_title: favoriteButton.closest('.movie').querySelector('h3').textContent,
                            movie_category: 'Category',
                            movie_year: 2024
                        })
                    }).then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            favoriteButton.classList.add('pressed');
                            event.target.classList.remove('fa-regular');
                            event.target.classList.add('fa-solid');
                        }
                    });
                }
            }
        }
    });
});

// Update removing movie from favorites in Favorite page.
document.addEventListener('DOMContentLoaded', function () {
    main.addEventListener('click', function (event) {
        if (event.target.classList.contains('heart-icon')) {
            const favoriteButton = event.target.closest('.favorite-btn');
            const movieId = favoriteButton.dataset.movieId;

            if (movieId) {
                if (favoriteButton.classList.contains('pressed')) {
                    fetch('/remove_favorite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            movie_id: movieId
                        })
                    }).then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            favoriteButton.classList.remove('pressed');
                            event.target.classList.remove('fa-solid');
                            event.target.classList.add('fa-regular');
                            // Refresh favorites list
                            loadFavorites();  // Call this function to refresh favorites after removal
                        }
                    });
                }
            }
        }
    });
});

getGenres();
getMovies(`${BASE_URL}/discover`);