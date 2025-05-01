/**
 * Lyrics Finder Service
 * Handles API calls to the lyrics.ovh API
 */

const LyricsService = {
    /**
     * Fetch lyrics for a specific artist and song title
     * @param {string} artist - The artist name
     * @param {string} title - The song title
     * @returns {Promise<Object>} - The response object with lyrics or error
     */
    getLyrics: async function(artist, title) {
      try {
        const encodedArtist = encodeURIComponent(artist);
        const encodedTitle = encodeURIComponent(title);
        
        console.log(`API call: https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`);
        
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            return { 
              success: false, 
              error: true, 
              message: `No lyrics found for "${title}" by "${artist}". The song may not be in our database.`
            };
          }
          
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
          success: true,
          lyrics: data.lyrics
        };
      } catch (error) {
        console.error('API Error details:', error);
        
        return { 
          success: false,
          error: true, 
          message: 'Failed to fetch lyrics. Please try a different song or check your spelling.'
        };
      }
    },
    
    /**
     * Search for songs by artist and title
     * @param {string} artist - The artist name
     * @param {string} title - The song title
     * @returns {Promise<Object>} - The response object with search results
     */
    searchSong: async function(artist, title) {
      try {
        const lyricsResult = await this.getLyrics(artist, title);
        
        if (lyricsResult.success) {
          return {
            success: true,
            results: [{
              id: '1',
              title,
              artist,
              exactMatch: true,
              hasLyrics: true
            }]
          };
        }
        
        // If exact match isn't found, return some alternatives
        // In a real app, we would use a proper search API
        // This is just a simplified implementation
        return {
          success: true,
          results: [
            { id: '1', title, artist, exactMatch: true, hasLyrics: false },
            { id: '2', title: `${title} (Live)`, artist, exactMatch: false, hasLyrics: false },
            { id: '3', title: `${title} (Acoustic Version)`, artist, exactMatch: false, hasLyrics: false }
          ]
        };
      } catch (error) {
        console.error('Search error:', error);
        return {
          success: false,
          message: 'An error occurred while searching for the song. Please try again later.'
        };
      }
    }
  };