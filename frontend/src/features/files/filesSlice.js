import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/axios';

const initialState = {
  files: [],
  rootFiles: [],
  isLoading: false,
  isError: false,
  message: '',
  currentPath: '',
};

export const getRootFiles = createAsyncThunk('files/getRootFiles', async (userId, thunkAPI) => {
  try {
    const response = await api.get(`/file/rootfile?id=${userId}`);
    return response.data;
  } catch (error) {
    const message = 
      (error.response && 
       error.response.data && 
       error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getFiles = createAsyncThunk('files/getFiles', async (userId, thunkAPI) => {
  try {
    const response = await api.get(`/file/files/?id=${userId}`);
    return response.data;
  } catch (error) {
    const message = 
      (error.response && 
       error.response.data && 
       error.response.data.message) ||
      error.message ||
      error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const getSpecificFiles = createAsyncThunk(
  'files/getSpecificFiles',
  async ({ userId, filename, parentPath }, thunkAPI) => {
    try {
      const fullPath = parentPath 
        ? `${parentPath}/${filename}`.replace(/\/+/g, '/')
        : filename;
      
      const response = await api.get(`/file/specificfile?id=${userId}&filename=${encodeURIComponent(fullPath)}`);
      return response.data;
    } catch (error) {
      const message = 
        (error.response && 
         error.response.data && 
         error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const filesSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getRootFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getRootFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rootFiles = action.payload;
      })
      .addCase(getRootFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload;
      })
      .addCase(getFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getSpecificFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSpecificFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rootFiles = action.payload;
        if (action.meta.arg.filename) {
          state.currentPath = action.meta.arg.parentPath 
            ? `${action.meta.arg.parentPath}/${action.meta.arg.filename}`
            : action.meta.arg.filename;
        }
      })
      .addCase(getSpecificFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export default filesSlice.reducer;
