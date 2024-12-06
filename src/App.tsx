//import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VesuviusTable from "./artifact-component";
import SegmentDetail from "./segment-details";
import Layout from "./Layout";

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<VesuviusTable />} />
          <Route
            path="/scroll/:scrollNum/segment/:segmentId"
            element={<SegmentDetail />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
