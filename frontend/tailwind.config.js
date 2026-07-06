/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names (removes unused CSS in production)
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom colours, fonts, or spacing here later if needed
    },
  },
  plugins: [],
}
