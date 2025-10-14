/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				sans: ["Poppins", "sans-serif"],
			},
			animation: {
				"scan-y": "scan-y 3s ease-in-out infinite",
			},
			keyframes: {
				"scan-y": {
					"0%, 100%": { top: "0%", opacity: 0.8 },
					"50%": { top: "98%", opacity: 1 },
				},
			},
		},
	},
	plugins: [],
};
