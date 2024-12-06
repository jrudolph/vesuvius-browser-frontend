//import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VesuviusTable from "./artifact-component";
import SegmentDetail from "./segment-details";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VesuviusTable />} />
        <Route
          path="/scroll/:scrollNum/segment/:segmentId"
          element={<SegmentDetail />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
