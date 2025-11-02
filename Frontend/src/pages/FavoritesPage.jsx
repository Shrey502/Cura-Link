// src/pages/FavoritesPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../api'; // Our API helper
import '../App.css'; // Use the same CSS

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- 1. Fetch Favorites on Page Load ---
  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await api.get('/favorites');
      setFavorites(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
      setError('Could not load your favorites.');
      setLoading(false);
    }
  };

  // --- 2. Handle Removing a Favorite ---
  const handleRemoveFavorite = async (itemId, itemType) => {
    try {
      // Send the delete request to the backend
      await api.delete('/favorites', {
        data: { itemId, itemType } // Axios 'delete' needs a 'data' property for the body
      });
      
      // Instantly remove the item from the UI
      setFavorites(prevFavorites => 
        prevFavorites.filter(fav => 
          !(fav.favorited_item_id === itemId && fav.item_type === itemType)
        )
      );
    } catch (err) {
      console.error('Failed to remove favorite', err);
      alert('Could not remove favorite.');
    }
  };

  if (loading) return <div>Loading favorites...</div>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: 'auto' }}>
      <h1>My Favorites</h1>
      <div className="results-column">
        {favorites.length === 0 ? (
          <p>You haven't added any favorites yet.</p>
        ) : (
          favorites.map((fav) => (
            <div key={`${fav.item_type}-${fav.favorited_item_id}`} className="result-item">
              <span style={{ background: '#eee', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {fav.item_type}
              </span>
              <h4 style={{ marginTop: '0.5rem' }}>{fav.title}</h4>
              <p>{fav.summary}</p>
              
              <button 
                onClick={() => handleRemoveFavorite(fav.favorited_item_id, fav.item_type)}
                style={{ background: '#dc3545', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;