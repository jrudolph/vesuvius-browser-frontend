//import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy } from "react";
import VesuviusTable from "./components/VesuviusTable";
import Layout from "./Layout";
import "./App.css";

const SegmentDetail = lazy(() => import("./components/SegmentDetails"));
const SegmentURLReport = lazy(() => import("./components/SegmentUrlReport"));

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
