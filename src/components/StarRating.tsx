import React from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  editable?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, editable = false }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex">
      {stars.map((star) => (
        <span
          key={star}
          className={`text-2xl ${
            editable ? 'cursor-pointer' : ''
          } ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          onClick={() => editable && onRatingChange && onRatingChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

export default StarRating;
