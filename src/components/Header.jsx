export default function Header() {
  return (
    <header
      style={{
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid #eee",
        backgroundColor: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <h1 style={{ fontSize: "18px", fontWeight: 700 }}>캠플</h1>
    </header>
  );
}
