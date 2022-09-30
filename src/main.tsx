import {createRoot} from "react-dom/client";
import App from "./App";
import "./index.css";

// const jsx = <div className="card">
//   <a href=""></a>
// </div>

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
