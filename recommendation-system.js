// Recommendation System using Sentiment Analysis
const API_KEY = "d8f50a3371afc220d8657c2416c8514b";

// Function to analyze all existing reviews
async function analyzeExistingReviews(db) {
    try {
        const reviewsRef = db.ref('reviews');
        const snapshot = await reviewsRef.once('value');
        
        snapshot.forEach((movieSnapshot) => {
            movieSnapshot.forEach(async (reviewSnapshot) => {
                const review = reviewSnapshot.val();
                
                // Skip if review already has sentiment data
                if (review.sentiment) return;
                
                // Analyze sentiment using the simple approach
                const sentiment = window.sentimentAnalysis.simpleSentimentAnalysis(review.text);
                
                // Update the review with sentiment data
                await reviewSnapshot.ref.update({
                    sentiment: sentiment
                });
            });
        });
        
        console.log('Successfully analyzed all existing reviews');
    } catch (error) {
        console.error('Error analyzing existing reviews:', error);
    }
}

// Function to get user's sentiment preferences from reviews
async function getUserSentimentPreferences(userId, db) {
    try {
        const reviewsRef = db.ref('reviews');
        const snapshot = await reviewsRef.once('value');
        const userReviews = [];
        
        snapshot.forEach((movieSnapshot) => {
            movieSnapshot.forEach((reviewSnapshot) => {
                const review = reviewSnapshot.val();
                if (review.userId === userId && review.sentiment) {
                    userReviews.push({
                        ...review,
                        movieId: movieSnapshot.key
                    });
                }
            });
        });

        if (userReviews.length === 0) return null;

        // Calculate average sentiment and magnitude
        let totalSentiment = 0;
        let totalMagnitude = 0;
        
        userReviews.forEach(review => {
            totalSentiment += review.sentiment.score;
            totalMagnitude += review.sentiment.magnitude;
        });
        
        return {
            sentiment: totalSentiment / userReviews.length,
            magnitude: totalMagnitude / userReviews.length,
            reviewCount: userReviews.length
        };
    } catch (error) {
        console.error('Error getting user preferences:', error);
        return null;
    }
}

// Function to get recommended movies based on sentiment
async function getRecommendedMoviesBySentiment(preferences) {
    try {
        // Get popular movies from TMDb
        const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US`);
        const data = await response.json();
        
        // Get detailed information for each movie
        const moviesWithDetails = await Promise.all(
            data.results.slice(0, 20).map(async (movie) => {
                const details = await getMovieDetails(movie.id);
                return details;
            })
        );

        // Filter out any null results
        const validMovies = moviesWithDetails.filter(movie => movie !== null);

        // Sort movies based on sentiment preferences
        const sortedMovies = validMovies.sort((a, b) => {
            // If user prefers positive sentiment, prioritize movies with higher ratings
            if (preferences.sentiment > 0) {
                return b.vote_average - a.vote_average;
            }
            // If user prefers negative sentiment, prioritize movies with lower ratings
            else if (preferences.sentiment < 0) {
                return a.vote_average - b.vote_average;
            }
            // If neutral, prioritize by popularity
            return b.popularity - a.popularity;
        });

        return sortedMovies.slice(0, 6);
    } catch (error) {
        console.error('Error getting recommended movies:', error);
        return [];
    }
}

// Function to get movie details
async function getMovieDetails(movieId) {
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Error getting movie details:', error);
        return null;
    }
}

// Function to display recommended movies
function displayRecommendedMovies(movies, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = movies.map(movie => `
        <div class="movie-card" onclick="window.location.href='movie-details.html?id=${movie.id}'">
            <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
            <div class="movie-info">
                <div class="movie-title">${movie.title}</div>
                <div class="movie-rating">⭐ ${movie.vote_average.toFixed(1)}</div>
            </div>
        </div>
    `).join('');
}

// Export functions
window.recommendationSystem = {
    analyzeExistingReviews,
    getUserSentimentPreferences,
    getRecommendedMoviesBySentiment,
    displayRecommendedMovies
}; 