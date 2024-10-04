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
const loginModal = document.getElementById('login-modal'); // Add this line to handle login modal
const signupForm = document.getElementById('signup-form');
const closeSignupModal = document.getElementById('close-signup-modal');
const closeLoginModal = document.getElementById('close-login-modal'); // Add this line to close login modal
const signupBtn = document.getElementById('signup-btn'); // Add this if you have a 'Join' button in the header
const loginForm = document.getElementById('login-form'); // Add this line to handle login form

let currentPage = 1;
let currentUrl = '';
let totalPages = 1;
let isNavigating = false;

autocompleteContainer.classList.add('autocomplete-container');
search.parentNode.appendChild(autocompleteContainer);

// Function to show flash messages
function showFlashMessage(message, category) {
    const flashWrapper = document.getElementById('flash-wrapper');
    const flashMessage = document.getElementById('flash-messages');

    // Set the message and category
    flashMessage.textContent = message;
    flashMessage.className = `flash-message ${category}`; // Add class based on category

    // Show the flash message
    flashWrapper.style.display = 'flex';

    // Remove flash message after 3 seconds
    setTimeout(() => {
        flashWrapper.style.display = 'none';
    }, 1500);
}


// Function to handle login/logout button display
function updateAuthButtons() {
    const authContainer = document.getElementById('auth-container');
    fetch('/is_logged_in', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => response.json())
    .then(data => {
        if (data.is_logged_in) {
            // If user is logged in, show username and logout button
            authContainer.innerHTML = `
                <span id="user-name" class="auth-btn green-btn">${data.username}</span>
                <button id="logout-btn" class="auth-btn">Logout</button>
            `;

            // Add event listener for logout
            document.getElementById('logout-btn').addEventListener('click', function() {
                fetch('/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    if (response.ok) {
                        showFlashMessage('Logout successful', 'success');
                        updateAuthButtons();
                    }
                });
            });

        } else {
            // If user is not logged in, show login and join buttons
            authContainer.innerHTML = `
                <button id="login-btn" class="auth-btn">Login</button>
                <button id="signup-btn" class="auth-btn">Join</button>
            `;

            // Add event listeners for login/signup modals
            document.getElementById('login-btn').addEventListener('click', function() {
                document.getElementById('login-modal').style.display = 'block';
            });
            document.getElementById('signup-btn').addEventListener('click', function() {
                document.getElementById('signup-modal').style.display = 'block';
            });
        }
    });
}


// Initialize the auth buttons on page load
document.addEventListener('DOMContentLoaded', updateAuthButtons);

// Handle signup form submission
signupForm.addEventListener('submit', function (event) {
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
            signupModal.style.display = 'none';  // Close the signup modal
            updateAuthButtons();
        } else {
            showFlashMessage(data.message, 'error');
        }
    });
});

// Handle login form submission

loginForm.addEventListener('submit', function (event) {
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
        } else {
            showFlashMessage(data.error, 'error');
        }
    });
});

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
            currentPage = 1;  // Reset to the first page for a new search
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
        currentPage = 1;  // Reset to the first page for a new category
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
    // Remove any existing 'page' parameter from the URL
    url = url.replace(/(\?|&)page=\d+/g, '');
    
    // Set the current URL for pagination
    currentUrl = url;

    // Check if the URL already contains '?', if not, add it before 'page'
    const separator = url.includes('?') ? '&' : '?';

    console.log(`Fetching movies from URL: ${url}${separator}page=${page}`); // Debugging log

    // Fetch the movies from the API
    return fetch(`${url}${separator}page=${page}`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length !== 0) {
                showMovies(data.results);
                updatePagination(page, data.total_pages);
                totalPages = data.total_pages; // Update total pages from the response
            } else {
                main.innerHTML = `<h1 class="no-results">No Results Found</h1>`;
            }
        })
        .catch(err => {
            console.error("Error fetching movies:", err);
            main.innerHTML = `<h1 class="error">Error fetching movies</h1>`;
        });
}

// Display movies on the page
function showMovies(data) {
    main.innerHTML = '';  // Clear the main section

    data.forEach(movie => {
        const { title, poster_path, vote_average, overview, id } = movie;
        const movieEl = document.createElement('div');
        movieEl.classList.add('movie');
        movieEl.innerHTML = `
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
            </div>
        `;
        main.appendChild(movieEl);
    });
}

// Helper function to set colors based on movie ratings
function getColor(vote) {
    if (vote >= 8) {
        return 'green';
    } else if (vote >= 5) {
        return 'orange';
    } else {
        return 'red';
    }
}

// Add event listeners for pagination buttons
prevPageButton.addEventListener('click', () => {
    if (currentPage > 1 && !isNavigating) {
        isNavigating = true; // Block further clicks until navigation completes
        currentPage--; // Update the page number first
        getMovies(currentUrl, currentPage)
            .finally(() => {
                isNavigating = false; // Allow future clicks
            });
    }
});

nextPageButton.addEventListener('click', () => {
    if (currentPage < totalPages && !isNavigating) {
        isNavigating = true; // Block further clicks until navigation completes
        currentPage++; // Update the page number first
        getMovies(currentUrl, currentPage)
            .finally(() => {
                isNavigating = false; // Allow future clicks
            });
    }
});

// Function to update the pagination controls
function updatePagination(currentPage, totalPages) {
    currentPageDisplay.textContent = currentPage;

    // Enable or disable "Previous" button
    if (currentPage > 1) {
        prevPageButton.classList.remove('disabled');
    } else {
        prevPageButton.classList.add('disabled');
    }

    // Enable or disable "Next" button
    if (currentPage < totalPages) {
        nextPageButton.classList.remove('disabled');
    } else {
        nextPageButton.classList.add('disabled');
    }
}

// Event listener for form submit to handle search queries
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const searchTerm = search.value.trim();
    currentPage = 1;  // Reset to the first page for a new search
    if (searchTerm) {
        getMovies(`${BASE_URL}/search?query=${searchTerm}`);
    } else {
        getMovies(`${BASE_URL}/discover`);
        resetToTrending();
    }
});

// Function to reset the category selection to "Trending"
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

// Event listener for input to handle autocomplete
search.addEventListener('input', (e) => {
    fetchAutocomplete(e.target.value);
});

// Event listeners for opening and closing the signup modal
signupBtn.addEventListener('click', () => {
    signupModal.style.display = 'block';
});

closeSignupModal.addEventListener('click', () => {
    signupModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target == signupModal) {
        signupModal.style.display = 'none';
    }
});

// Handle the sign-up form submission
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const passwordConfirm = document.getElementById('signup-password-confirm').value;

    // Validate the input fields
    if (!username || !email || !password) {
        alert("Please fill out all fields.");
        return;
    }

    if (!validateEmail(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (password !== passwordConfirm) {
        alert("Passwords do not match.");
        return;
    }

    if (!validatePassword(password)) {
        alert("Password does not meet the required criteria.");
        return;
    }

    // Send data to backend for user creation
    registerUser(username, email, password);
});

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password validation function
function validatePassword(password) {
    // Add your password criteria here (e.g., length, uppercase, etc.)
    return password.length >= 8; // Example criteria: at least 8 characters
}

// Send data to the backend for registration
function registerUser(username, email, password) {
    fetch(`${BASE_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert('User registered successfully! A confirmation email has been sent.');
            signupModal.style.display = 'none'; // Close the signup modal
        } else {
            alert(`Error: ${data.message}`);
        }
    })
    .catch(err => {
        console.error('Error registering user:', err);
        alert('Failed to register user.');
    });
}




// Autocomplete and genre initialization
getGenres();
getMovies(`${BASE_URL}/discover`);

// Existing functions... continue with any other features
