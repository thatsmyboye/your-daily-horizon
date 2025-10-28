import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { enhancedAnalytics } from "./lib/analytics";

// Initialize analytics
enhancedAnalytics.initialize().then(() => {
  console.log('Analytics initialized');
}).catch((error) => {
  console.error('Failed to initialize analytics:', error);
});

createRoot(document.getElementById("root")!).render(<App />);
