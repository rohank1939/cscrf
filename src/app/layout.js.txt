import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Entity Registration Form",
  description: "A responsive form for entity registration with email validation.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Link to Inter font from Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
