//import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VesuviusTable from "./components/VesuviusTable";
import SegmentDetail from "./components/SegmentDetails";
import Layout from "./Layout";
import SegmentURLReport from "./components/SegmentUrlReport";
import "./App.css";

const App = () => {
  return (
    <BrowserRouter basename="/v2/">
      <Layout>
        <Routes>
          <Route path="/" element={<VesuviusTable />} />
          <Route
            path="/scroll/:scrollNum/segment/:segmentId"
            element={<SegmentDetail />}
          />
          <Route path="/report" element={<SegmentURLReport />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
