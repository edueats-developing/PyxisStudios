import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, editable = false }) => {
  const stars = [1, 2, 3, 4, 5];
  const roundedRating = Math.round(rating * 4) / 4; // Round to nearest 0.25

  const getStarFill = (star: number) => {
    const difference = roundedRating - (star - 1);
    if (difference >= 1) return 100; // full star
    if (difference <= 0) return 0; // empty star
    return Math.round(difference * 100); // partial star
  };

  return (
    <div className="flex items-center">
      {stars.map((star) => {
        const fillPercentage = getStarFill(star);
        
        return (
          <span
            key={star}
            className={`text-2xl ${editable ? 'cursor-pointer' : ''} relative`}
            onClick={() => editable && onRatingChange && onRatingChange(star)}
          >
            {fillPercentage > 0 ? (
              <>
                <span 
                  className="absolute text-yellow-400 overflow-hidden" 
                  style={{ width: `${fillPercentage}%` }}
                >
                  ★
                </span>
                <span className="text-gray-300">★</span>
              </>
            ) : (
              <span className="text-gray-300">★</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

export default StarRating;
