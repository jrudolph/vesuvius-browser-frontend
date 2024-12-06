//import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import VesuviusTable from "./components/VesuviusTable";
import SegmentDetail from "./components/SegmentDetails";
import Layout from "./Layout";

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
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
