function SuspenseLoader() {
  return (
    <div
      className="suspense-loader"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "fixed",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        overflow: "auto",
        flex: "1 0 auto",
        backgroundColor: "#080a30",
      }}
    >
      Loading...
    </div>
  );
}

export default SuspenseLoader;