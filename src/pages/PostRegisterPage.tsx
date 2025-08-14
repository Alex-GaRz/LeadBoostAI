import React from 'react';
import PostRegisterForm from '../components/PostRegisterForm';
import ProtectedRoute from '../components/ProtectedRoute';
import { useNavigate } from 'react-router-dom';

const PostRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <ProtectedRoute>
      <PostRegisterForm onComplete={() => navigate('/dashboard')} />
    </ProtectedRoute>
  );
};

export default PostRegisterPage;
