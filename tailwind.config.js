/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: { 
                "primary": "#1976D2", 
                "primary-hover": "#0fb880", 
                "primary-dark": "#0a8a60", 
                "background-light": "#f6f8f7", 
                "background-dark": "#10221c", 
                "surface-light": "#ffffff", 
                "surface-dark": "#162e26", 
                "text-main": "#171717ff", 
                "text-muted": "#202120ff", 
            },

            fontFamily: { 
                "display": ["Inter", "sans-serif"] 
            },
            
            borderRadius: { 
                "DEFAULT": "0.25rem", 
                "lg": "0.5rem", 
                "xl": "0.75rem", 
                "full": "9999px" 
            },
        },
    }, 
    plugins: [],
}