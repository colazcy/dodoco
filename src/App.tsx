import {
  AnalysisProgress,
  Index,
  Player,
  Settings,
  ErrorDisplay,
} from "@/routes";
import { ReactElement } from "react";
import { Route, Routes } from "react-router";

const App = (): ReactElement => {
  return (
    <Routes>
      <Route index element={<Index />} />
      <Route path="player" element={<Player />} />
      <Route path="settings" element={<Settings />} />
      <Route path="analysis-progress" element={<AnalysisProgress />} />
      <Route path="error-display" element={<ErrorDisplay />} />
    </Routes>
  );
};
export default App;
