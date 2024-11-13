// src/RatingForm.js
import React, { useState } from "react";

const RatingForm = ({ onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    wifi: 0,
    power: 0,
    noise: 0,
    coffeeQuality: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(ratings);
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: '200px' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Rate this Coffice</h3>
      
      {Object.entries(ratings).map(([category, value]) => (
        <div key={category} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>
            {category.charAt(0).toUpperCase() + category.slice(1)}:
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '20px',
                  color: star <= value ? '#ffd700' : '#ccc'
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      ))}
      
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Submit
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default RatingForm;
