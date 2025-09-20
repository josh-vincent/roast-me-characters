'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export function Header() {
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              🔥 Roast Me
            </Link>
          </div>
          
          <nav className="flex items-center space-x-4">
            {/* Gallery Link */}
            <Link 
              href="/gallery" 
              className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
            >
              {user ? 'My Gallery' : 'Gallery'}
            </Link>
            
            {/* Credits Display */}
            {!loading && (
              <div className="hidden sm:flex items-center space-x-3">
                {user && (
                  <div className="flex items-center bg-gray-50 rounded-full px-3 py-1.5 border border-gray-200">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-xs">🔥</span>
                      </div>
                      <span className="text-gray-700 text-sm font-medium">
                        <span className="text-purple-600 font-bold">Credits Available</span>
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Get More Credits / Sign In Button */}
                {user && (
                  <div className="flex items-center space-x-2">
                    {user ? (
                      <Link 
                        href="/credits" 
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Get More Credits
                      </Link>
                    ) : (
                      <button 
                        onClick={() => signInWithGoogle()}
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Sign in with Google</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* User Avatar / Menu */}
            {user && (
              <div className="flex items-center space-x-3">
                <Link 
                  href="/credits"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium hidden md:block"
                >
                  Credits
                </Link>
                
                {/* User Avatar Dropdown */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                    {user.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt={user.email || 'User'} 
                        className="w-8 h-8 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                        {(user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Account
                      </p>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/credits"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Manage Credits
                      </Link>
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Sign In Button for Desktop when not logged in */}
            {!user && !loading && (
              <button 
                onClick={() => signInWithGoogle()}
                className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}