/**
 * Lyrics Finder App
 * Main application script
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchForm = document.getElementById('search-form');
    const artistInput = document.getElementById('artist-input');
    const songInput = document.getElementById('song-input');
    const searchButton = document.getElementById('search-button');
    const searchFormContainer = document.getElementById('search-form-container');
    const currentSearchBanner = document.getElementById('current-search-banner');
    const currentSearchArtistTitle = document.getElementById('current-search-artist-title');
    const searchResultsContainer = document.getElementById('search-results-container');
    const resultsList = document.getElementById('results-list');
    const newSearchButton = document.getElementById('new-search-button');
    const lyricsContainer = document.getElementById('lyrics-container');
    const backButton = document.getElementById('back-button');
    const backToSearchButton = document.getElementById('back-to-search-button');
    const songTitle = document.getElementById('song-title');
    const songArtist = document.getElementById('song-artist');
    const lyricsLoading = document.getElementById('lyrics-loading');
    const lyricsNotFound = document.getElementById('lyrics-not-found');
    const notFoundMessage = document.getElementById('not-found-message');
    const lyricsText = document.getElementById('lyrics-text');
    const snackbar = document.getElementById('snackbar');
    const snackbarMessage = document.getElementById('snackbar-message');
    const snackbarClose = document.getElementById('snackbar-close');
    const twinklingStarsContainer = document.getElementById('twinkling-stars');
    const downloadButton = document.getElementById('download-lyrics-button');
    
    // App State
    let isLoading = false;
    let searchResults = [];
    let selectedSong = null;
    let currentView = 'search'; // 'search', 'results', or 'lyrics'
    
    // Initialize the application
    init();
    
    /**
     * Initialize the application
     */
    function init() {
      // Set up event listeners
      searchForm.addEventListener('submit', handleSearchSubmit);
      newSearchButton.addEventListener('click', handleBackToSearch);
      backButton.addEventListener('click', handleBackFromLyrics);
      backToSearchButton.addEventListener('click', handleBackToSearch);
      snackbarClose.addEventListener('click', hideSnackbar);
      downloadButton.addEventListener('click', downloadLyrics);
      
      // Create twinkling stars
      createTwinklingStars();
      
      // Set focus on artist input
      artistInput.focus();
    }
    
    /**
     * Handle search form submission
     * @param {Event} e - The form submit event
     */
    function handleSearchSubmit(e) {
      e.preventDefault();
      
      const artist = artistInput.value.trim();
      const title = songInput.value.trim();
      
      if (!artist || !title) {
        showSnackbar('Please enter both artist and song title', 'warning');
        return;
      }
      
      performSearch(artist, title);
    }
    
    /**
     * Perform search for song lyrics
     * @param {string} artist - The artist name
     * @param {string} title - The song title
     */
    async function performSearch(artist, title) {
      setLoading(true);
      
      try {
        console.log(`Searching for "${title}" by "${artist}"`);
        const response = await LyricsService.searchSong(artist, title);
        
        if (response.success) {
          searchResults = response.results;
          
          if (response.results.length === 1 && response.results[0].exactMatch && response.results[0].hasLyrics) {
            await selectSong(response.results[0]);
            return;
          }
          
          showView('results');
          renderSearchResults();
        } else {
          showSnackbar(response.message || 'Error searching for song', 'error');
        }
      } catch (error) {
        console.error('Search error:', error);
        showSnackbar('An unexpected error occurred. Please try again.', 'error');
      } finally {
        setLoading(false);
      }
    }
    
    /**
     * Render search results in the UI
     */
    function renderSearchResults() {
      resultsList.innerHTML = '';
      
      if (!searchResults || searchResults.length === 0) {
        return;
      }
      
      searchResults.forEach((result, index) => {
        const item = document.createElement('li');
        item.className = `result-item ${result.exactMatch ? 'exact-match' : ''}`;
        item.dataset.id = result.id;
        
        item.innerHTML = `
          <div class="result-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="icon">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          <div class="result-content">
            <div class="result-title">
              ${result.title}
              ${result.exactMatch ? '<span class="exact-match-badge">Exact Match</span>' : ''}
            </div>
            <div class="result-artist">${result.artist}</div>
          </div>
        `;
        
        item.addEventListener('click', () => selectSong(result));
        
        resultsList.appendChild(item);
        
        // Add divider if not the last item
        if (index < searchResults.length - 1) {
          const divider = document.createElement('li');
          divider.className = 'result-divider';
          resultsList.appendChild(divider);
        }
      });
    }
    
    /**
     * Select a song and fetch its lyrics
     * @param {Object} song - The selected song
     */
    async function selectSong(song) {
      selectedSong = song;
      showView('lyrics');
      setLoading(true);
      
      // Update UI
      songTitle.textContent = song.title;
      songArtist.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" class="icon">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
        ${song.artist}
      `;
      
      // Clear previous lyrics
      lyricsText.textContent = '';
      lyricsText.style.display = 'none';
      lyricsNotFound.style.display = 'none';
      lyricsLoading.style.display = 'flex';
      
      try {
        console.log(`Getting lyrics for "${song.title}" by "${song.artist}"`);
        const result = await LyricsService.getLyrics(song.artist, song.title);
        
        if (result.success) {
          lyricsText.textContent = result.lyrics || 'No lyrics available for this song';
          lyricsLoading.style.display = 'none';
          lyricsText.style.display = 'block';
        } else {
          notFoundMessage.textContent = result.message || 'No lyrics found for this song';
          lyricsLoading.style.display = 'none';
          lyricsNotFound.style.display = 'flex';
          showSnackbar(result.message || 'No lyrics found', 'info');
        }
      } catch (error) {
        console.error('Lyrics fetch error:', error);
        notFoundMessage.textContent = 'Failed to load lyrics. Please try again later.';
        lyricsLoading.style.display = 'none';
        lyricsNotFound.style.display = 'flex';
        showSnackbar('Failed to load lyrics', 'error');
      } finally {
        setLoading(false);
      }
    }
    
    /**
     * Handle back button click from lyrics view
     */
    function handleBackFromLyrics() {
      showView('search');
    }
    
    /**
     * Handle back to search button click
     */
    function handleBackToSearch() {
      showView('search');
    }
    
    /**
     * Show the specified view and hide others
     * @param {string} view - The view to show ('search', 'results', or 'lyrics')
     */
    function showView(view) {
      currentView = view;
      
      // Hide all views
      searchFormContainer.style.display = 'none';
      currentSearchBanner.style.display = 'none';
      searchResultsContainer.style.display = 'none';
      lyricsContainer.style.display = 'none';
      
      // Show the selected view
      switch (view) {
        case 'search':
          searchFormContainer.style.display = 'block';
          break;
        case 'results':
          currentSearchBanner.style.display = 'block';
          searchResultsContainer.style.display = 'block';
          currentSearchArtistTitle.textContent = `${artistInput.value} - ${songInput.value}`;
          break;
        case 'lyrics':
          currentSearchBanner.style.display = 'block';
          lyricsContainer.style.display = 'block';
          currentSearchArtistTitle.textContent = `${selectedSong.artist} - ${selectedSong.title}`;
          break;
      }
    }
    
    /**
     * Set loading state
     * @param {boolean} loading - Whether the app is loading
     */
    function setLoading(loading) {
      isLoading = loading;
      
      if (loading) {
        searchButton.innerHTML = `
          <div class="spinner" style="width: 20px; height: 20px; margin-right: 8px;"></div>
          <span>Searching...</span>
        `;
        searchButton.disabled = true;
      } else {
        searchButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>Search</span>
        `;
        searchButton.disabled = false;
      }
    }
    
    /**
     * Show a snackbar message
     * @param {string} message - The message to show
     * @param {string} type - The type of message ('info', 'success', 'warning', 'error')
     */
    function showSnackbar(message, type = 'info') {
      snackbarMessage.textContent = message;
      snackbar.className = `snackbar ${type} show`;
      
      // Hide after 5 seconds
      setTimeout(hideSnackbar, 5000);
    }
    
    /**
     * Hide the snackbar
     */
    function hideSnackbar() {
      snackbar.className = snackbar.className.replace('show', '');
    }
    
    /**
     * Download lyrics as a text file
     */
    function downloadLyrics() {
      if (!selectedSong || !lyricsText.textContent) {
        showSnackbar('No lyrics available to download', 'warning');
        return;
      }
      
      const fileName = `${selectedSong.artist} - ${selectedSong.title}.txt`;
      const fileContent = `${selectedSong.title}\nby ${selectedSong.artist}\n\n${lyricsText.textContent}`;
      
      // Create a blob with the text content
      const blob = new Blob([fileContent], { type: 'text/plain' });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element for downloading
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      
      // Trigger a click on the anchor to start the download
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      showSnackbar('Lyrics downloaded successfully', 'success');
    }
    
    /**
     * Create twinkling stars in the background
     */
    function createTwinklingStars() {
      // Clear any existing stars
      twinklingStarsContainer.innerHTML = '';
      
      // Create stars
      const numStars = 150;
      for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3 + 0.8;
        
        // Random animation duration between 2 and 8 seconds
        const duration = Math.random() * 6 + 2;
        
        // Random delay
        const delay = Math.random() * 8;
        
        // Random brightness variation
        const maxBrightness = Math.random() * 0.3 + 0.7; // Between 70% and 100%
        const minBrightness = Math.random() * 0.2; // Between 0% and 20%
        
        // Set custom variables for this star's animation
        star.style.setProperty('--max-brightness', maxBrightness);
        star.style.setProperty('--min-brightness', minBrightness);
        star.style.setProperty('--duration', `${duration}s`);
        
        // Set styles
        star.style.top = `${top}%`;
        star.style.left = `${left}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        // Add to DOM
        twinklingStarsContainer.appendChild(star);
      }
      
      // Set up interval for shooting stars
      setInterval(createShootingStar, 5000);
    }
    
    /**
     * Create a shooting star
     */
    function createShootingStar() {
      // Only create a shooting star 30% of the time
      if (Math.random() > 0.3) return;
      
      const shootingStar = document.createElement('div');
      shootingStar.classList.add('shooting-star');
      
      // Random position at top of screen
      const startLeft = Math.random() * 80;
      shootingStar.style.top = `${Math.random() * 40}%`;
      shootingStar.style.left = `${startLeft}%`;
      
      // Random angle for trajectory (between 30 and 60 degrees)
      const angle = Math.random() * 30 + 30;
      shootingStar.style.transform = `rotate(${angle}deg)`;
      
      // Random duration between 1 and 3 seconds
      const duration = Math.random() * 2 + 1;
      shootingStar.style.animationDuration = `${duration}s`;
      
      // Add to DOM
      twinklingStarsContainer.appendChild(shootingStar);
      
      // Remove after animation completes
      setTimeout(() => {
        if (shootingStar.parentNode === twinklingStarsContainer) {
          twinklingStarsContainer.removeChild(shootingStar);
        }
      }, duration * 1000 + 100);
    }
  });