import React from 'react';
import './Loader.css';

const Loader = ({ contained = false, label = "Loading data..." }) => {
  return (
    <div className={`loader-container ${contained ? 'contained' : ''}`}>
      <div className="loader-wrapper">
        <div className="loader-ring"></div>
        <div className="loader-ring-inner"></div>
        <div className="loader-text">HW</div>
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  );
};

export default Loader;
