// src/FilterPanel.js
import React, { useState } from "react";

const FilterPanel = ({ onFilter }) => {
  const [minWifi, setMinWifi] = useState(0);
  const [minOutlets, setMinOutlets] = useState(0);
  const [minNoise, setMinNoise] = useState(0);
  const [minCoffee, setMinCoffee] = useState(0);

  const handleFilter = () => {
    onFilter({ minWifi, minOutlets, minNoise, minCoffee });
  };

  return (
    <div>
      <label>
        Min Wifi Rating:
        <input type="number" value={minWifi} onChange={(e) => setMinWifi(e.target.value)} />
      </label>
      <label>
        Min Outlets Rating:
        <input type="number" value={minOutlets} onChange={(e) => setMinOutlets(e.target.value)} />
      </label>
      <label>
        Min Noise Level:
        <input type="number" value={minNoise} onChange={(e) => setMinNoise(e.target.value)} />
      </label>
      <label>
        Min Coffee Quality:
        <input type="number" value={minCoffee} onChange={(e) => setMinCoffee(e.target.value)} />
      </label>
      <button onClick={handleFilter}>Apply Filters</button>
    </div>
  );
};

export default FilterPanel;

