export const metadata = {
  title: "SmartClub – Soutien scolaire à Tahiti",
  description: "Apprendre autrement, progresser ensemble et prendre confiance en soi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f7f9fc", color: "#1a2238" }}>
        {children}
      </body>
    </html>
  );
}
