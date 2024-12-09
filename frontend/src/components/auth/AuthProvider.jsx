import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '../../features/auth/authSlice';

const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(checkAuth());
    }
  }, [dispatch]);

  return children;
};

export default AuthProvider;