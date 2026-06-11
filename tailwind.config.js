export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: { 50:'#E1F5EE',100:'#9FE1CB',200:'#5DCAA5',400:'#1D9E75',600:'#0F6E56',800:'#085041',900:'#04342C' },
        gray: { 50:'#F7F6F3',100:'#EDECE8',200:'#D3D1C7',400:'#888780',600:'#5F5E5A',800:'#2C2C2A',900:'#1A1A18' },
        amber: { 100:'#FAC775',400:'#BA7517' },
        coral: { 50:'#FAECE7',400:'#D85A30' },
        orange: { 50:'#FFF1E6',400:'#E07A30',700:'#B85A10' },
      },
      fontFamily: { sans: ['DM Sans','system-ui','sans-serif'], mono: ['DM Mono','monospace'] },
    },
  },
  plugins: [],
}
