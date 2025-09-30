import React, { useState } from 'react';
import './App.css';

function App() {
  const [plotImage, setPlotImage] = useState(null);
  const [requirements, setRequirements] = useState({
    total_rooms: 3,
    total_area: 35.0,
    required_rooms: 'Living Room,Bedroom,Kitchen',
    vastu_compliant: false,
    plot_orientation: 'north'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [samplePlans, setSamplePlans] = useState([]);

  const handleImageUpload = (e) => {
    setPlotImage(e.target.files[0]);
  };

  const handleRequirementChange = (field, value) => {
    setRequirements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateFloorPlan = async () => {
    if (!plotImage) {
      alert('Please upload a plot image');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('plot_image', plotImage);

    Object.keys(requirements).forEach(key => {
      formData.append(key, requirements[key]);
    });

    try {
      const response = await fetch('http://localhost:5000/analyze_and_generate', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/get_sample_plans');
      const data = await response.json();
      setSamplePlans(data.plans);
    } catch (error) {
      console.error('Error loading sample plans:', error);
    }
  };

  React.useEffect(() => {
    loadSamplePlans();
  }, []);

  const downloadSVG = () => {
    if (!result?.svg_plan) return;

    const blob = new Blob([result.svg_plan], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor_plan.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJSON = () => {
    if (!result?.generated_plan) return;

    const blob = new Blob([JSON.stringify(result.generated_plan, null, 2)], 
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor_plan_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🏠 AI Floor Plan Designer</h1>
        <p>Upload your plot image and generate custom floor plans with AI</p>
      </header>

      <div className="container">
        <div className="input-section">
          <h2>📋 Project Requirements</h2>
          
          <div className="form-group">
            <label>Plot Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input"
            />
            {plotImage && <p className="file-name">Selected: {plotImage.name}</p>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Rooms:</label>
              <input
                type="number"
                value={requirements.total_rooms}
                onChange={(e) => handleRequirementChange('total_rooms', parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>

            <div className="form-group">
              <label>Total Area (sq m):</label>
              <input
                type="number"
                step="0.1"
                value={requirements.total_area}
                onChange={(e) => handleRequirementChange('total_area', parseFloat(e.target.value))}
                min="10"
                max="500"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Required Rooms (comma separated):</label>
            <input
              type="text"
              value={requirements.required_rooms}
              onChange={(e) => handleRequirementChange('required_rooms', e.target.value)}
              placeholder="Living Room,Bedroom,Kitchen,Bathroom"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Plot Orientation:</label>
              <select
                value={requirements.plot_orientation}
                onChange={(e) => handleRequirementChange('plot_orientation', e.target.value)}
              >
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={requirements.vastu_compliant}
                  onChange={(e) => handleRequirementChange('vastu_compliant', e.target.checked)}
                />
                Vastu Compliant
              </label>
            </div>
          </div>

          <button
            onClick={generateFloorPlan}
            disabled={loading || !plotImage}
            className="generate-button"
          >
            {loading ? '🔄 Generating...' : '✨ Generate Floor Plan'}
          </button>
        </div>

        {result && (
          <div className="result-section">
            <h2>🎯 Generated Floor Plan</h2>
            
            <div className="result-content">
              <div className="plan-visualization">
                <div 
                  className="svg-container"
                  dangerouslySetInnerHTML={{ __html: result.svg_plan }}
                />
                
                <div className="download-buttons">
                  <button onClick={downloadSVG} className="download-btn">
                    📥 Download SVG
                  </button>
                  <button onClick={downloadJSON} className="download-btn">
                    📄 Download JSON
                  </button>
                </div>
              </div>

              <div className="plan-details">
                <h3>Room Details</h3>
                <div className="room-list">
                  {result.generated_plan.rooms.map((room, index) => (
                    <div key={index} className="room-item">
                      <strong>{room.room_name}</strong>
                      <span>{room.length} x {room.width} cm</span>
                      <span>Area: {(room.length * room.width / 10000).toFixed(1)} sq m</span>
                    </div>
                  ))}
                </div>

                <div className="analysis-details">
                  <h4>Plot Analysis</h4>
                  <p>Detected Area: {result.plot_analysis.plot_area.toFixed(0)} pixels</p>
                  <p>Dimensions: {result.plot_analysis.width} x {result.plot_analysis.height}</p>
                  <p>Aspect Ratio: {result.plot_analysis.aspect_ratio.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="sample-section">
          <h2>🏛️ Sample Floor Plans</h2>
          <div className="sample-grid">
            {samplePlans.slice(0, 6).map((plan, index) => (
              <div key={index} className="sample-card">
                <h4>{plan.filename}</h4>
                <p>Rooms: {plan.total_rooms}</p>
                <p>Area: {plan.total_area} sq m</p>
                <div className="room-tags">
                  {plan.rooms.map((room, i) => (
                    <span key={i} className="room-tag">{room.room_name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
