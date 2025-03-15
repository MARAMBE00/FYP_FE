import React, { useState, useRef } from 'react';
import { Upload, FileUp, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import '../styles/TopographerDashboard.css';
import Navbar from './Navbar';

interface PatientData {
  firstName: string;
  lastName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  idNumber: string;
  prediction: string;
  report: string;
  dateTime: string;
}

interface PredictionResponse {
  predicted_class: string;
  confidence: number;
}

interface TopographerDashboardProps {
  onLogout: () => void;
}

const TopographerDashboard: React.FC<TopographerDashboardProps> = ({ onLogout }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [patientData, setPatientData] = useState<Partial<PatientData>>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPrediction(null);
        setShowPatientForm(false);
        setError(null);
      } else {
        setError('Please select an image file');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setPrediction(null);
      setShowPatientForm(false);
      setError(null);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get prediction');
      }

      const data: PredictionResponse = await response.json();
      
      // Format the prediction result with the updated terminology
      const accuracyPercentage = (data.confidence * 100).toFixed(2);
      const predictionText = `Result: ${data.predicted_class}\nAccuracy: ${accuracyPercentage}%`;
      setPrediction(predictionText);
      setShowPatientForm(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during prediction');
      setPrediction(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTryAgain = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrediction(null);
    setShowPatientForm(false);
    setPatientData({});
    setError(null);
  };

  const handlePatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentDateTime = new Date().toISOString();
    const fullPatientData: PatientData = {
      ...patientData as PatientData,
      prediction: prediction || '',
      report: '',
      dateTime: currentDateTime
    };
    
    // Here you would typically send this data to your backend
    console.log('Patient data submitted:', fullPatientData);
    
    // Reset the form
    handleTryAgain();
  };

  // For demonstration purposes, let's simulate a prediction result
  const simulatePrediction = () => {
    if (selectedFile && !prediction) {
      const accuracyPercentage = "99.77";
      const predictionText = `Result: Keratoconus\nAccuracy: ${accuracyPercentage}%`;
      setPrediction(predictionText);
      setShowPatientForm(true);
    }
  };

  return (
    <div className="topographer-dashboard">
      <Navbar role="topographer" onLogout={onLogout} username="Michael Brown" />
      
      <div className="dashboard-content">
        <div className="upload-section">
          <div className="instructions">
            <h3>Instructions:</h3>
            <ol>
              <li>Upload a clear, high-resolution image</li>
              <li>Supported formats: JPG, PNG</li>
              <li>Maximum file size: 10MB</li>
              <li>Ensure proper lighting in the image</li>
              <li>Wait for the prediction results</li>
              <li>Fill in patient details when prompted</li>
            </ol>
          </div>

          <div
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
                <div className="preview-overlay">
                  <p>Click or drag to replace</p>
                </div>
              </div>
            ) : (
              <div className="upload-placeholder">
                <Upload size={48} />
                <p>Click or drag image here</p>
                <span>Supported formats: JPG, PNG</span>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {selectedFile && !prediction && (
            <div className="action-buttons">
              <button 
                className="try-again-button"
                onClick={handleTryAgain}
              >
                <RotateCcw size={20} />
                Try Again
              </button>
              <button 
                className="process-button"
                onClick={isUploading ? undefined : simulatePrediction}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <div className="spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FileUp size={20} />
                    Process Image
                  </>
                )}
              </button>
            </div>
          )}

          {prediction && (
            <div className="prediction-result">
              <div className="prediction-header">
                <CheckCircle2 size={24} className="success-icon" />
                <h3>Analysis Complete</h3>
              </div>
              
              {previewUrl && (
                <div className="image-analysis-container">
                  <div className="analyzed-image-container">
                    <img src={previewUrl} alt="Analyzed image" className="analyzed-image" />
                  </div>
                  <pre className="prediction-text">{prediction}</pre>
                </div>
              )}
              
              <div className="prediction-actions">
                <button 
                  className="try-again-button"
                  onClick={handleTryAgain}
                >
                  <RotateCcw size={20} />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {showPatientForm && (
            <form onSubmit={handlePatientSubmit} className="patient-form">
              <h3>Patient Information</h3>
              
              <div className="form-group">
                <label>First Name:</label>
                <input
                  type="text"
                  value={patientData.firstName || ''}
                  onChange={e => setPatientData({ ...patientData, firstName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name:</label>
                <input
                  type="text"
                  value={patientData.lastName || ''}
                  onChange={e => setPatientData({ ...patientData, lastName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Age:</label>
                <input
                  type="number"
                  value={patientData.age || ''}
                  onChange={e => setPatientData({ ...patientData, age: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender:</label>
                <select
                  value={patientData.gender || ''}
                  onChange={e => setPatientData({ ...patientData, gender: e.target.value as PatientData['gender'] })}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>ID Number:</label>
                <input
                  type="text"
                  value={patientData.idNumber || ''}
                  onChange={e => setPatientData({ ...patientData, idNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Analysis Result:</label>
                <textarea
                  value={prediction || ''}
                  readOnly
                  className="readonly-field"
                />
              </div>

              <button type="submit" className="submit-button">
                <FileUp size={20} />
                <span>Submit Patient Data</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopographerDashboard;