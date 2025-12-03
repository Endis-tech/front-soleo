/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      
      colors: {
        'soleo-dark': '#1a1919ff',     // App BG
        'soleo-light': '#fef9c3',    //
        'soleo-yellow': '#fde047',   //
        'soleo-brown': '#434343ff',    // Tarjetas
        'soleo-green': '#22c55e',    // Green (Acento secundario)
        'soleo-text-dark': '#4f2c1d', 
        'soleo-accent-red': '#FF4136', // rachas 
        
      
        'gym-dark': '#1A1A1A',        
        'gym-gray': '#2C2C2C',        
        'gym-light-gray': '#A0A0A0',  
        'gym-accent-red': '#FF4136',  
        'gym-accent-blue': '#007BFF', 
        'gym-text-light': '#F5F5F5',  
        'gym-text-dark': '#1A1A1A',   
      },
      
      fontFamily: {
        'sans': ['Inter', 'sans-serif'],
        'heading': ['Oswald', 'sans-serif'],
      }
    },
  },
  plugins: [],
};