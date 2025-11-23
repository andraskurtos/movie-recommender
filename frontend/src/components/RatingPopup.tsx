import { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';

interface RatingPopupProps {
    isOpen: boolean;
    onClose: () => void;
    movieTitle: string;
    movieId: number;
    onRatingSubmitted: () => void;
}

const RatingPopup = ({ isOpen, onClose, movieTitle, movieId, onRatingSubmitted }: RatingPopupProps) => {
    const [rating, setRating] = useState<number>(6);
    const [review, setReview] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useUser();

    useEffect(() => {
        if (!isOpen) {
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!user) return;
        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/User/${user.id}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    movieId,
                    rating,
                    review: review.trim() || null, // Send null if review is empty
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to submit rating: ${response.statusText}`);
            }

            // Rating submitted successfully
            onRatingSubmitted();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit rating');
            console.error('Error submitting rating:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-white mb-4">Rate "{movieTitle}"</h2>
                
                {/* Rating Input */}
                <div className="mb-6">
                    <label className="block text-white mb-2">Your Rating: {rating}/10</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-sm text-gray-400 mt-1">
                        <span>1</span>
                        <span>10</span>
                    </div>
                </div>

                {/* Review Input */}
                <div className="mb-6">
                    <label className="block text-white mb-2">Your Review (Optional)</label>
                    <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Write your thoughts about the movie..."
                        className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-900/50 text-red-200 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Submitting...</span>
                            </>
                        ) : (
                            <span>Submit</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingPopup;