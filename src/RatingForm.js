// src/RatingForm.js
import React, { useState } from "react";
import colors from './styles/colors';

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

  const categoryLabels = {
    wifi: '📶 WiFi',
    power: '🔌 Power',
    noise: '🔊 Noise',
    coffee: '☕️ Coffee'
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3 style={styles.title}>Rate this Coffice</h3>
      
      <div style={styles.ratingsGrid}>
        {Object.entries(ratings).map(([category, value]) => (
          category !== 'comment' && (
            <div key={category} style={styles.ratingItem}>
              <label style={styles.label}>
                {categoryLabels[category]}:
              </label>
              <div style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatings(prev => ({ ...prev, [category]: star }))}
                    style={{
                      ...styles.starButton,
                      color: star <= value ? '#ffd700' : '#cccccc'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
      
      <div style={styles.commentContainer}>
        <textarea
          value={ratings.comment}
          onChange={(e) => setRatings(prev => ({ ...prev, comment: e.target.value }))}
          style={styles.textarea}
          placeholder="Add a comment (optional)"
          rows="2"
        />
      </div>
      
      <div style={styles.buttonContainer}>
        <button type="submit" style={styles.submitButton}>
          Submit
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    padding: '8px 0',
    width: '100%',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text.primary,
  },
  ratingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  },
  ratingItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '14px',
    color: colors.text.secondary,
    whiteSpace: 'nowrap',
  },
  starsContainer: {
    display: 'flex',
    gap: '2px',
  },
  starButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'transform 0.1s ease',
    WebkitTapHighlightColor: 'transparent',
  },
  commentContainer: {
    marginBottom: '12px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: `1px solid ${colors.border}`,
    fontSize: '14px',
    resize: 'vertical',
    minHeight: '40px',
    backgroundColor: colors.background.paper,
    color: colors.text.primary,
  },
  buttonContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  submitButton: {
    padding: '8px',
    backgroundColor: colors.primary.main,
    color: colors.text.white,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  cancelButton: {
    padding: '8px',
    backgroundColor: colors.background.paper,
    color: colors.text.primary,
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  }
};

export default RatingForm;
