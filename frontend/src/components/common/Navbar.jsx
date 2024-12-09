import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { logout } from '../../features/auth/authSlice';
import { useSidebar } from '../../context/SidebarContext';
import api from '../../utils/axios';
import { getRootFiles } from '../../features/files/filesSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { toggleSidebar } = useSidebar();

  const isDashboard = location.pathname === '/dashboard';

  const pages = user 
    ? ['Dashboard'] 
    : [];
  const settings = user 
    ? ['Backup Files', 'Logout'] 
    : ['Login', 'Sign Up'];

  const handleOpenNavMenu = (event) => {
    if (user) {
      toggleSidebar();
    } else {
      setAnchorElNav(event.currentTarget);
    }
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleMenuClick = async (setting) => {
    handleCloseUserMenu();
    switch (setting) {
      case 'Backup Files':
        try {
          const response = await api.post(`/file/restore/${user.id}`);
          if (location.pathname.includes('/dashboard')) {
            dispatch(getRootFiles(user.id));
          }
          alert("Backup restored successfully.");
        } catch (error) {
          console.error('Error restoring backup:', error);
          alert(error.response?.data?.Message || 'Failed to restore backup');
        }
        break;
      case 'Login':
        navigate('/login');
        break;
      case 'Sign Up':
        navigate('/signup');
        break;
      case 'Logout':
        dispatch(logout());
        navigate('/');
        break;
      case 'Profile':
        navigate('/profile');
        break;
        
      default:
        break;
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        width: '100%',
        zIndex: (theme) => theme.zIndex.drawer + 1
      }}
    >
      <Toolbar disableGutters>
        <CloudUploadIcon sx={{ display: { xs: 'none', md: 'flex' }, ml: user && isDashboard ? 2 : 1, mr: 1 }} />
        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          SafeBox
        </Typography>

        {!user && (
          <Menu
            id="menu-appbar"
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            open={Boolean(anchorElNav)}
            onClose={handleCloseNavMenu}
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
            {pages.map((page) => (
              <MenuItem key={page} onClick={() => {
                navigate(`/${page.toLowerCase()}`);
                handleCloseNavMenu();
              }}>
                <Typography textAlign="center">{page}</Typography>
              </MenuItem>
            ))}
          </Menu>
        )}

        <Typography
          variant="h6"
          noWrap
          component="a"
          href="/"
          sx={{
            display: { xs: 'flex', md: 'none' },
            flexGrow: 1,
            fontFamily: 'monospace',
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
            ml: 2
          }}
        >
          FileBackup
        </Typography>

        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          {pages.map((page) => (
            <Button
              key={page}
              onClick={() => navigate(`/${page.toLowerCase()}`)}
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              {page}
            </Button>
          ))}
        </Box>

        {user ? (
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }} style={{marginRight:"20px"}}>
                <Avatar alt={user?.name} src={user?.avatar} />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={() => handleMenuClick(setting)}>
                  <Typography textAlign="center">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mr: 2 }}>
            <Button
              onClick={() => navigate('/login')}
              variant="outlined"
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/signup')}
              variant="contained"
              sx={{ my: 2, color: 'white', display: 'block' }}
            >
              Sign Up
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;