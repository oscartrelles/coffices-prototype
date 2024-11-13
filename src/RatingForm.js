// src/RatingForm.js
import React, { useState } from "react";

const RatingForm = ({ onSubmit, onCancel }) => {
  const [ratings, setRatings] = useState({
    wifi: 0,
    power: 0,
    noise: 0,
    coffee: 0,
    comment: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(ratings);
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: '200px' }}>
      <h3 style={{ margin: '0 0 12px 0' }}>Rate this Coffice</h3>
      
      {Object.entries(ratings).map(([category, value]) => (
        category !== 'comment' && (
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
        )
      ))}
      
      <div style={{ marginBottom: '16px' }}>
        <label 
          htmlFor="comment" 
          style={{ display: 'block', marginBottom: '4px' }}
        >
          Comment:
        </label>
        <textarea
          id="comment"
          value={ratings.comment}
          onChange={(e) => setRatings(prev => ({ ...prev, comment: e.target.value }))}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            minHeight: '80px',
            resize: 'vertical'
          }}
          placeholder="Share your experience..."
        />
      </div>
      
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
