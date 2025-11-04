import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Review {
    id: number;
    movie: {
        id: number;
        title: string;
        year: number;
        posterUrl: string;
    };
    rating: number;
    reviewText: string;
    createdAt: string;
}

function ProfilePage() {
    const { user } = useUser();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5253';

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user?.id) return;
            
            try {
                const response = await fetch(`${API_URL}/api/Users/${user.id}/ratings`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Reviews fetched:', data);
                    setReviews(data);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [user?.id, API_URL]);

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {/* Profile Header Section - 1/3 of viewport height */}
            <div className="bg-gray-800 shadow-md h-[33vh] relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center h-full py-6">
                        {/* Profile Picture */}
                        <div className="flex-shrink-0">
                            <div className="h-40 w-40 rounded-full bg-gray-700 border-4 border-gray-600 shadow-lg overflow-hidden">
                                {/* Placeholder profile image */}
                                <img 
                                    src={user.profilePictureUrl || 'https://via.placeholder.com/150'}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="ml-8 flex-grow">
                            <h1 className="text-3xl font-bold text-gray-100 mb-2">
                                {user.displayName || user.username}
                            </h1>
                            <div className="text-gray-300 space-y-2">
                                <p className="flex items-center">
                                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {user.email}
                                </p>
                                <p className="flex items-center">
                                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Joined October 2025
                                </p>
                                <div className="flex items-center space-x-4 mt-4">
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-gray-100">127</div>
                                        <div className="text-sm text-gray-400">Ratings</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xl font-bold text-gray-100">4.2</div>
                                        <div className="text-sm text-gray-400">Avg Rating</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-gray-800 shadow-md rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-100 mb-6">Recent Activity</h2>
                    {loading ? (
                        <p className="text-gray-300">Loading your reviews...</p>
                    ) : reviews.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {reviews.map((review) => (
                                <div key={review.id} className="group relative">
                                    {/* Movie Card */}
                                    <div className="relative overflow-hidden rounded-lg shadow-lg transform transition duration-300 hover:scale-105 cursor-pointer bg-gray-700">
                                        <img 
                                            src={`https://media.themoviedb.org/t/p/w600_and_h900_bestv2/${review.movie.posterUrl}`}
                                            alt={review.movie.title}
                                            className="w-full h-auto object-cover"
                                        />
                                        
                                        {/* Rating Badge */}
                                        <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                                            {review.rating}/10
                                        </div>

                                        {/* Hover Overlay with Review Text */}
                                        <div className="absolute inset-0 bg-black bg-opacity-90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 rounded-lg">
                                            <div>
                                                <h3 className="text-white font-bold text-sm mb-2">{review.movie.title}</h3>
                                                <p className="text-gray-300 text-xs mb-3">({review.movie.year})</p>
                                                <div className="flex items-center mb-2">
                                                    <span className="text-yellow-400 font-semibold">{review.rating}/10</span>
                                                </div>
                                            </div>
                                            
                                            {review.reviewText && (
                                                <div className="flex-grow overflow-y-auto mb-2">
                                                    <p className="text-gray-200 text-xs leading-relaxed">
                                                        "{review.reviewText}"
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <p className="text-gray-400 text-xs">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400">No reviews yet. Start rating movies to see them here!</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
