import React, { useEffect, useState } from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Description, Image, VideoLibrary, Audiotrack, InsertDriveFile } from '@mui/icons-material';

const fileIconMap = {
  'jpg': <Image />,
  'jpeg': <Image />,
  'png': <Image />,
  'gif': <Image />,
  'mp4': <VideoLibrary />,
  'mp3': <Audiotrack />,
  'pdf': <Description />,
  'doc': <Description />,
  'docx': <Description />
};

const DashboardContent = () => {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('YOUR_AWS_ENDPOINT');
        const data = await response.json();
        setFiles(data.files);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };

    fetchFiles();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <List>
        {files.map((file, index) => {
          const extension = file.name.split('.').pop().toLowerCase();
          const icon = fileIconMap[extension] || <InsertDriveFile />;
          return (
            <ListItem key={index}>
              <ListItemIcon>{icon}</ListItemIcon>
              <ListItemText primary={file.name} />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default DashboardContent;