import { useRoutes } from "react-router-dom";
import routes from "./router";

function App() {
  const content = useRoutes(routes);

  return <div className="text-white bg-black">{content}</div>;
}

export default App;
