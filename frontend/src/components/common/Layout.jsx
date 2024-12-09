import { Box, Container } from '@mui/material';
import styled from 'styled-components';

const MainContent = styled(Box)`
  padding-top: 24px;
  padding-bottom: 24px;
  min-height: calc(100vh - 64px); 
`;

const Layout = ({ children, maxWidth = 'lg' }) => {
  return (
    <MainContent>
      <Container maxWidth={maxWidth}>
        {children}
      </Container>
    </MainContent>
  );
};

export default Layout;