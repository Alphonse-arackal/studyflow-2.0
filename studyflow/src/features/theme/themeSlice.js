import { createSlice } from '@reduxjs/toolkit'

const savedTheme = localStorage.getItem('studyflow-theme')

const initialState = {
  mode: savedTheme === 'dark' ? 'dark' : 'light',
}

const themeSlice = createSlice({
  name: 'theme',

  initialState,

  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },

    setTheme: (state, action) => {
      state.mode = action.payload
    },
  },
})

export const { toggleTheme, setTheme } = themeSlice.actions

export default themeSlice.reducer