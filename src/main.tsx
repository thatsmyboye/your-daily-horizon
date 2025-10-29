import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enhancedAnalytics } from "./lib/analytics";

// Initialize analytics (non-blocking)
enhancedAnalytics.initialize().then(() => {
  console.log('Analytics initialized');
}).catch((error) => {
  console.warn('Analytics initialization failed, continuing without analytics:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
