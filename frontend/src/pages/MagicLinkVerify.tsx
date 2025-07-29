import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MagicLinkVerify = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const hasVerified = useRef(false); // Add this to prevent multiple calls

  useEffect(() => {
    const token = searchParams.get('token');
    if (token && !hasVerified.current) {
      hasVerified.current = true; // Mark as verified
      verifyMagicLink(token)
        .then(() => navigate('/'))
        .catch(() => navigate('/login'));
    } else if (!token) {
      toast.error('No magic link token found');
      navigate('/login');
    }
  }, [searchParams, navigate]); // Remove verifyMagicLink from dependencies

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Verifying your magic link...</p>
      </div>
    </div>
  );
};

export default MagicLinkVerify;