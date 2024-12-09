
const mockFiles = [
  { id: 1, name: 'document.pdf', size: 1024000, uploadDate: '2023-04-15T10:30:00Z' },
  { id: 2, name: 'image.jpg', size: 2048000, uploadDate: '2023-04-14T15:45:00Z' },
  { id: 3, name: 'spreadsheet.xlsx', size: 512000, uploadDate: '2023-04-13T09:15:00Z' },
  { id: 4, name: 'presentation.pptx', size: 3072000, uploadDate: '2023-04-12T14:00:00Z' },
  { id: 5, name: 'video.mp4', size: 15360000, uploadDate: '2023-04-11T11:30:00Z' },
];

const fileService = {
  getFiles: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockFiles);
      }, 500);
    });
  },
};

export default fileService;
