import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getFiles, getSpecificFiles } from '../../features/files/filesSlice';
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Folder,
  FolderOpen,
  Description,
  Image,
  VideoLibrary,
  Audiotrack,
  InsertDriveFile,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useSidebar } from '../../context/SidebarContext';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundColor: theme.palette.background.default,
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const FileTreeItem = ({ item, level = 0 }) => {
  console.log('Rendering FileTreeItem:', item);

  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const getFileIcon = (fileName) => {
    if (item.isFolder || fileName.endsWith('/')) {
      return isOpen ? <FolderOpen sx={{ color: '#FFA000' }} /> : <Folder sx={{ color: '#FFA000' }} />;
    }

    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension)) return <Image color="primary" />;
    if (['mp4', 'avi', 'mov'].includes(extension)) return <VideoLibrary color="error" />;
    if (['mp3', 'wav'].includes(extension)) return <Audiotrack color="success" />;
    if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) return <Description color="primary" />;
    
    return <InsertDriveFile />;
  };

  const isFolder = item.isFolder || item.name.endsWith('/');

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
      
      if (item.name !== `${user?.username}'s Folder`) {
        let currentElement = item;
        let path = [];
        let parent = currentElement._parent;
        
        path.unshift(currentElement.name.replace('/', ''));
        while (parent && parent.name !== `${user?.username}'s Folder`) {
          path.unshift(parent.name.replace('/', ''));
          parent = parent._parent;
        }

        const fullPath = path.join('/');
        
        //navigate(`/dashboard/${fullPath}`);
        
        // dispatch(getSpecificFiles({ 
        //   userId: user.id, 
        //   filename: item.name.replace('/', ''),
        //   parentPath: path.slice(0, -1).join('/')
        // }));
      }
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          pl: isFolder ? level * 2 + 1 : level * 2 + 4,
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {isFolder && (
          <ListItemIcon sx={{ minWidth: 32 }}>
            <IconButton size="small" sx={{ p: 0 }}>
              {isOpen ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          </ListItemIcon>
        )}
        <ListItemIcon sx={{ minWidth: 32 }}>
          {getFileIcon(item.name)}
        </ListItemIcon>
        <ListItemText 
          primary={item.name.replace('/', '')}
          sx={{ 
            '& .MuiTypography-root': { 
              fontSize: '0.875rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            } 
          }}
        />
      </ListItemButton>
      {isFolder && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children?.map((child, index) => (
              <FileTreeItem 
                key={`${child.name}-${index}`} 
                item={child} 
                level={level + 1} 
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const Sidebar = () => {
  const { sidebarOpen = true } = useSidebar();
  const { files } = useSelector(state => state.files);
  const { user } = useSelector(state => state.auth);

  const buildFileTree = (files) => {
    const root = { 
      name: `${user?.username}'s Folder`,
      isFolder: true,
      children: []
    };
    
    const map = new Map();
    map.set('', root);

    files.forEach(file => {
      console.log('Processing file:', file.name);

      const parts = file.name.split('/').filter(Boolean);
      let currentPath = '';
      let parentNode = root;
      
      parts.forEach((part, index) => {
        const isLastPart = index === parts.length - 1;
        const newPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!map.has(newPath)) {
          const newNode = {
            name: part,
            isFolder: !isLastPart || file.isFolder,
            children: [],
            _parent: parentNode,
            ...(!isLastPart ? {} : file)
          };
          
          parentNode.children.push(newNode);
          map.set(newPath, newNode);
          parentNode = newNode;
        } else {
          parentNode = map.get(newPath);
        }
        
        currentPath = newPath;
      });
    });

    return [root];
  };

  const fileTree = buildFileTree(files || []);
  console.log('File Tree:', fileTree);
  console.log('Files from state:', files);

  return (
    <StyledDrawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          EXPLORER
        </Typography>
      </Box>
      <Divider />
      <List component="nav" sx={{ p: 1 }}>
        {fileTree.map((item, index) => (
          <FileTreeItem key={`${item.name}-${index}`} item={item} />
        ))}
      </List>
    </StyledDrawer>
  );
};

export default Sidebar;