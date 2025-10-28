import { useUser } from '../hooks/useUser';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function ProfilePage() {
    const { user } = useUser();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

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
                    <h2 className="text-2xl font-bold text-gray-100 mb-4">Recent Activity</h2>
                    <p className="text-gray-300">Content will go here...</p>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
