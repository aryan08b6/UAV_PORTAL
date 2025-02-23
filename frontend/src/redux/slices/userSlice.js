import { createSlice } from '@reduxjs/toolkit';
import { act } from 'react';

const initialState = {
  name: '',
  type: "loggedOut",
  id:"" 
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    addUserDetails: (state, action) => {
      console.log(action.payload.data.username)
      state.name = action.payload.data.username;
      state.type = action.payload.data.isAdmin ? "Admin" : "User";
      state.id = action.payload.data._id;
    },
    removeUserDetails: (state) => {
      state.name = '';
      state.type = "loggedOut";
      state.id = "";
    },
  },
});

export const { addUserDetails, removeUserDetails } = userSlice.actions;
export default userSlice.reducer;