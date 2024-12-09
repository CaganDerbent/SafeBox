import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
  Breadcrumbs,
  Link,
  Button
} from '@mui/material';
import { Download as DownloadIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import Sidebar from '../components/dashboard/Sidebar';
import { getRootFiles, getFiles, getSpecificFiles } from '../features/files/filesSlice';
import { formatFileSize, formatDate } from '../utils/helpers';
import { useSidebar } from '../context/SidebarContext';
import {
  Description,
  Image,
  VideoLibrary,
  Audiotrack,
  InsertDriveFile,
  Code,
  Archive,
  PictureAsPdf,
  Folder
} from '@mui/icons-material';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import api from '../utils/axios';
import { useNavigate, useLocation } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import { useMediaQuery, useTheme } from '@mui/material';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { rootFiles, isLoading, isError, message } = useSelector(state => state.files);
  const { user } = useSelector(state => state.auth);
  const { sidebarOpen } = useSidebar();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [currentPath, setCurrentPath] = useState([]);
  const fileInputRef = React.useRef(null);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user && user.id) {
      dispatch(getFiles(user.id));

      const path = location.pathname.split('/dashboard/')[1];
      if (path) {
        const pathParts = path.split('/');
        const newCurrentPath = [user.username + "'s Folder", ...pathParts];
        setCurrentPath(newCurrentPath);
        
        const lastFolder = pathParts[pathParts.length - 1];
        const parentPath = pathParts.slice(0, -1).join('/');
        
        dispatch(getSpecificFiles({ 
          userId: user.id, 
          filename: lastFolder,
          parentPath
        })).then(() => {
          navigate(location.pathname, { replace: true });
        });
      } else {
        setCurrentPath([user.username + "'s Folder"]);
        dispatch(getRootFiles(user.id));
      }
    }
  }, [user, location.pathname]);

  const getFileIcon = (item) => {
    if (item.isFolder || item.name.endsWith('/')) {
      return <Folder sx={{ color: '#FFA000' }} />;
    }

    const extension = item.name.split('.').pop().toLowerCase();
    

    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
      return <Image color="primary" />;
    }
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
      return <VideoLibrary color="error" />;
    }
    

    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return <Audiotrack color="success" />;
    }
    

    if (['doc', 'docx', 'txt', 'rtf'].includes(extension)) {
      return <Description color="primary" />;
    }

    if (extension === 'pdf') {
      return <PictureAsPdf color="error" />;
    }
    

    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'cpp'].includes(extension)) {
      return <Code color="secondary" />;
    }
    

    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return <Archive color="warning" />;
    }
    

    return <InsertDriveFile />;
  };

  const getItemType = (item) => {
    if (item.isFolder) {
      return 'Folder';
    }
    
    const extension = item.name.split('.').pop().toLowerCase();

    const typeMap = {
      jpg: 'Image', jpeg: 'Image', png: 'Image', gif: 'Image',
      mp4: 'Video', avi: 'Video', mov: 'Video',
      mp3: 'Audio', wav: 'Audio',
      pdf: 'PDF Document',
      doc: 'Word Document', docx: 'Word Document',
      txt: 'Text File',
      zip: 'Archive', rar: 'Archive'

    };
    
    return typeMap[extension] || 'File';
  };

  const handleDownloadClick = async (item) => {
    try {
      if (item.isFolder || item.name.endsWith('/')) {
        console.log('Cannot download folders');
        return;
      }

 
      const pathWithoutUsername = currentPath.slice(1);
      const fullPath = pathWithoutUsername.length > 0 
        ? `${pathWithoutUsername.join('/')}/${item.name}`
        : item.name;

      console.log('Downloading file:', fullPath);
      const response = await api.get(`/file/download/users/${user.id}/${fullPath}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', item.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleDeleteClick = async (item) => {
    try {
      const pathWithoutUsername = currentPath.slice(1);
      const fullPath = pathWithoutUsername.length > 0 
        ? `${pathWithoutUsername.join('/')}/${item.name}`
        : item.name;

      await api.delete(`/file/delete/${user.id}/${fullPath}`);
      
      if (user && user.id) {
        if (pathWithoutUsername.length > 0) {
          dispatch(getSpecificFiles({ 
            userId: user.id, 
            filename: pathWithoutUsername.join('/') 
          }));
        } else {
          dispatch(getRootFiles(user.id));
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const handleFolderClick = (folderName) => {
    try {
      const cleanFolderName = folderName.endsWith('/') ? folderName.slice(0, -1) : folderName;
      const pathWithoutUsername = currentPath.slice(1);
      const fullPath = pathWithoutUsername.length > 0 
        ? `${pathWithoutUsername.join('/')}/${cleanFolderName}`
        : cleanFolderName;
      
      dispatch(getSpecificFiles({ 
        userId: user.id, 
        filename: cleanFolderName,
        parentPath: pathWithoutUsername.join('/')
      }));
      
      navigate(`/dashboard/${fullPath}`);
      setCurrentPath([...currentPath, cleanFolderName]);
    } catch (error) {
      console.error('Error navigating to folder:', error);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === 0) {
      dispatch(getRootFiles(user.id));
      setCurrentPath([user.username + "'s Folder"]);
      navigate('/dashboard', { replace: true });
    } else {
      const newPath = currentPath.slice(0, index + 1);
      const pathWithoutUsername = newPath.slice(1);
      const fullPath = pathWithoutUsername.join('/');
      
      dispatch(getSpecificFiles({ 
        userId: user.id, 
        filename: pathWithoutUsername[pathWithoutUsername.length - 1],
        parentPath: pathWithoutUsername.slice(0, -1).join('/')
      }));
      
      navigate(`/dashboard/${fullPath}`, { replace: true });
      setCurrentPath(newPath);
    }
  };

  const handleUploadClick = (e) => {
    e.preventDefault(); 
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    try {
      const pathWithoutUsername = currentPath.slice(1);
      const fullPath = pathWithoutUsername.length > 0 
        ? `${pathWithoutUsername.join('/')}/${file.name}`
        : file.name;

      console.log('Uploading file to:', fullPath);

      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/file/upload/${user.id}/${fullPath}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });


      event.target.value = '';

      if (pathWithoutUsername.length > 0) {
        dispatch(getSpecificFiles({ 
          userId: user.id, 
          filename: pathWithoutUsername.join('/') 
        }));
      } else {
        dispatch(getRootFiles(user.id));
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleCreateFolder = () => {
    setIsCreateFolderDialogOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    try {
      const pathWithoutUsername = currentPath.slice(1);
      const fullPath = pathWithoutUsername.length > 0 
        ? `${pathWithoutUsername.join('/')}/${newFolderName}/`
        : `${newFolderName}/`;

      console.log('Creating folder at:', fullPath);
      
      await api.post(`/file/folder/${user.id}/${fullPath}`);
      

      setNewFolderName('');
      setIsCreateFolderDialogOpen(false);

      if (pathWithoutUsername.length > 0) {
        dispatch(getSpecificFiles({ 
          userId: user.id, 
          filename: pathWithoutUsername.join('/') 
        }));
      } else {
        dispatch(getRootFiles(user.id));
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Alert severity="error">{message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: { xs: 'column', md: 'row' },
      minHeight: '100vh',
      pt: { xs: 8, md: 10 }
    }}>
      <Box sx={{ 
        display: { xs: 'none', md: 'block' },
        width: 240,
        flexShrink: 0
      }}>
        <Sidebar />
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        width: { xs: '100%', md: 'calc(100% - 240px)' },
        ml: { xs: 0, md: 0 },
        p: 3
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 3, 
          justifyContent: 'space-between'
        }}>
          <Breadcrumbs 
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ 
              mb: 3,
              display: 'flex',
              flexWrap: 'wrap',
              '& .MuiBreadcrumbs-ol': {
                flexWrap: 'wrap'
              },
              '& .MuiBreadcrumbs-li': {
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }
            }}
          >
            {currentPath.map((path, index) => (
              <Link
                key={index}
                color="inherit"
                component="button"
                onClick={() => handleBreadcrumbClick(index)}
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }
                }}
              >
                {path}
              </Link>
            ))}
          </Breadcrumbs>

          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                onClick={(e) => e.target.value = ''}
              />
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth={matches}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' }
                }}
              >
                Upload File
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => setIsCreateFolderDialogOpen(true)}
                fullWidth={matches}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' }
                }}
              >
                Create Folder
              </Button>
            </Box>
          </Box>
        </Box>

        <Typography variant="h4" gutterBottom>
          
        </Typography>

        <TableContainer 
          component={Paper} 
          sx={{ 
            overflowX: 'auto',
            width: '100%'
          }}
        >
          <Table sx={{ 
            minWidth: { xs: 300, sm: 650 },
            '& .MuiTableCell-root': {
              px: { xs: 1, sm: 2 }
            }
          }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Modified Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rootFiles.map((item) => (
                <TableRow key={item.name}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {getFileIcon(item)}
                      {item.isFolder || item.name.endsWith('/') ? (
                        <Typography
                          sx={{ ml: 1, cursor: 'pointer', color: 'primary.main', textDecoration: 'underline' }}
                          onClick={() => handleFolderClick(item.name)}
                        >
                          {item.name}
                        </Typography>
                      ) : (
                        <Typography sx={{ ml: 1 }}>{item.name}</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {item.isFolder || item.name.endsWith('/') ? '-' : formatDate(item.lastModified)}
                  </TableCell>
                  <TableCell>{getItemType(item)}</TableCell>
                  <TableCell>{item.isFolder ? '--' : formatFileSize(item.size)}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 0.5, sm: 1 },
                      flexWrap: 'nowrap'
                    }}>
                      {!item.isFolder && !item.name.endsWith('/') && (
                        <>
                          <Tooltip title="Download">
                            <IconButton 
                              size="small"
                              onClick={() => handleDownloadClick(item)}
                            >
                              <DownloadIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small"
                              onClick={() => handleDeleteClick(item)}
                              sx={{ 
                                color: 'error.main',
                                '& .MuiSvgIcon-root': {
                                  fontSize: { xs: 18, sm: 24 }
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {rootFiles.length === 0 && (
          <Box textAlign="center" py={8}>
            <Typography variant="h6" color="text.secondary">
              No files or folders
            </Typography>
          </Box>
        )}

        <Dialog
          open={isCreateFolderDialogOpen}
          onClose={() => setIsCreateFolderDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Folder Name"
              type="text"
              fullWidth
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsCreateFolderDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateFolderSubmit} 
              variant="contained" 
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default Dashboard;