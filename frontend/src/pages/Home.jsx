import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import styled from 'styled-components';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';

const StyledHero = styled(Box)`
  background: linear-gradient(45deg, #2196f3 30%, #21cbf3 90%);
  color: white;
  padding: 100px 0;
  text-align: center;
`;

const FeatureCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
`;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  const features = [
    {
      title: 'Secure Storage',
      description: 'Your files are encrypted and stored securely in the cloud',
      icon: <SecurityIcon sx={{ fontSize: 60, color: '#2196f3' }} />,
    },
    {
      title: 'Fast Upload',
      description: 'Quick and efficient file upload with progress tracking',
      icon: <CloudUploadIcon sx={{ fontSize: 60, color: '#2196f3' }} />,
    },
    {
      title: 'Quick Recovery',
      description: 'Restore your files instantly whenever you need them',
      icon: <SpeedIcon sx={{ fontSize: 60, color: '#2196f3' }} />,
    },
  ];

  return (
    <Box>
      <StyledHero>
        <Container maxWidth="md">
          <Typography variant="h2" component="h1" gutterBottom>
            {user ? `Welcome ${user.username}!` : 'Secure File Backup Solution'}
          </Typography>
          <Typography variant="h5" component="p" gutterBottom>
            {user ? 'Manage your files securely in one place' : 'Keep your files safe and accessible anywhere, anytime'}
          </Typography>
          <Box mt={4}>
            {user ? (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/dashboard')}
                sx={{
                  backgroundColor: 'white',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/signup')}
                  sx={{
                    backgroundColor: 'white',
                    color: '#2196f3',
                    mr: 2,
                    '&:hover': {
                      backgroundColor: '#f5f5f5',
                    },
                  }}
                >
                  Get Started
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: 'white',
                    borderColor: 'white',
                    '&:hover': {
                      borderColor: '#f5f5f5',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Login
                </Button>
              </>
            )}
          </Box>
        </Container>
      </StyledHero>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {features.map((feature) => (
            <Grid item xs={12} md={4} key={feature.title}>
              <FeatureCard>
                <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                  {feature.icon}
                  <Typography variant="h5" component="h2" sx={{ mt: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
