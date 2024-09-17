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

let currentPage = 1;
let currentUrl = '';
let totalPages = 1;
let isNavigating = false;

autocompleteContainer.classList.add('autocomplete-container');
search.parentNode.appendChild(autocompleteContainer);

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

// Fetch genres and popular movies when the page loads
getGenres();
getMovies(`${BASE_URL}/discover`);
