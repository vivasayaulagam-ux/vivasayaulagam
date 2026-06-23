import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  size?: number;
}

export default function RatingStars({ rating, size = 15 }: RatingStarsProps) {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // round to nearest 0.5

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(roundedRating)) {
      stars.push(
        <Star
          key={i}
          size={size}
          className="fill-current text-[#ffc107] stroke-[#ffc107]"
        />
      );
    } else if (i === Math.ceil(roundedRating) && roundedRating % 1 !== 0) {
      stars.push(
        <div
          key={i}
          className="relative inline-block"
          style={{ width: size, height: size }}
        >
          {/* Background gray star */}
          <Star
            size={size}
            className="text-gray-250 stroke-gray-300 absolute top-0 left-0"
          />
          {/* Left half filled yellow star */}
          <div
            className="absolute top-0 left-0 overflow-hidden"
            style={{ width: "50%" }}
          >
            <Star
              size={size}
              className="fill-current text-[#ffc107] stroke-[#ffc107]"
            />
          </div>
        </div>
      );
    } else {
      stars.push(
        <Star
          key={i}
          size={size}
          className="text-gray-250 stroke-gray-350"
        />
      );
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}
