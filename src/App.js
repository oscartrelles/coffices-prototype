import React from "react";
import Map from "./Map";
import { LoadScript } from '@react-google-maps/api';

const libraries = ['places'];

function App() {
  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
      loadingElement={<div>Loading...</div>}
    >
      <Map />
    </LoadScript>
  );
}

export default App;

