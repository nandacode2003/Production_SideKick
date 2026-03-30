// src/pages/VerifyIdPage.js
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ScanFace, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AuroraBackground from '../components/ui/AuroraBackground';
import { GradientButton } from '../components/ui/UIKit';
import { OnboardingCard, StepIcon, ProgressBar, FileUploadZone, WebcamCapture } from '../components/onboarding/OnboardingKit';
import api from '../utils/api';

export default function VerifyIdPage() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('gov-id');
  const [idType, setIdType] = useState('aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [file, setFile] = useState(null);
  const [uploaded, setUploaded] = useState(false);
  const videoRef = useRef();
  const canvasRef = useRef();

  const stepIndex = step === 'gov-id' ? 3 : 4;

  const verifyId = async () => {
    if (idNumber.length < 6) return setError('Enter valid ID number');
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-id', { idType, idNumber });
      updateUser({ isIdVerified: true });
      toast.success('ID verified!');
      setStep('face-scan');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      setScanning(true);
    } catch { setError('Camera access denied.'); }
  };

  const captureFace = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const descriptor = canvas.toDataURL('image/jpeg', 0.5);
    video.srcObject?.getTracks().forEach(t => t.stop());
    setScanning(false);
    setLoading(true);
    try {
      await api.post('/auth/verify-face', { faceDescriptor: descriptor });
      updateUser({ isFaceVerified: true });
      toast.success('Face verified!');
      navigate('/setup-profile');
    } catch { setError('Face scan failed. Try again.'); }
    finally { setLoading(false); }
  };

  const handleFileSelect = (f) => { setFile(f); setUploaded(true); };

  const inputStyle = { width: '100%', height: 48, background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 12, padding: '0 14px', color: '#F1F0F7', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0B21', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <AuroraBackground intensity="subtle" />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ProgressBar currentStep={stepIndex} totalSteps={5} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
          <AnimatePresence mode="wait">
            {step === 'gov-id' && (
              <motion.div key="gov-id" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ width: '100%', maxWidth: 440 }}>
                <OnboardingCard>
                  <StepIcon icon={ShieldCheck} />
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F0F7', textAlign: 'center', letterSpacing: '-0.02em' }}>Verify your identity</h2>
                  <p style={{ fontSize: 14, color: '#A8A3C7', textAlign: 'center', marginTop: 6, marginBottom: 24 }}>Upload a government-issued ID</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ID Type</label>
                      <select style={{ ...inputStyle, cursor: 'pointer' }} value={idType} onChange={e => setIdType(e.target.value)}>
                        {[['aadhaar','Aadhaar Card'],['pan','PAN Card'],['passport','Passport'],['driving','Driving License']].map(([v,l]) => (
                          <option key={v} value={v} style={{ background: '#1A1535' }}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: '#6E6893', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ID Number</label>
                      <input style={inputStyle} placeholder="Enter ID number" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
                    </div>
                    <FileUploadZone onFileSelect={handleFileSelect} file={file} uploading={false} uploaded={uploaded} />
                    {error && <p style={{ color: '#F87171', fontSize: 13 }}>{error}</p>}
                    <GradientButton onClick={verifyId} loading={loading} fullWidth>Verify ID</GradientButton>
                    <p style={{ fontSize: 12, color: '#6E6893', textAlign: 'center' }}>Your ID is encrypted and never stored in plain text</p>
                  </div>
                </OnboardingCard>
              </motion.div>
            )}

            {step === 'face-scan' && (
              <motion.div key="face-scan" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} style={{ width: '100%', maxWidth: 440 }}>
                <OnboardingCard>
                  <StepIcon icon={ScanFace} />
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F1F0F7', textAlign: 'center', letterSpacing: '-0.02em' }}>Face verification</h2>
                  <p style={{ fontSize: 14, color: '#A8A3C7', textAlign: 'center', marginTop: 6, marginBottom: 20 }}>Position your face in the frame</p>
                  <WebcamCapture videoRef={videoRef} canvasRef={canvasRef} scanning={scanning} />
                  {error && <p style={{ color: '#F87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('gov-id')}
                      style={{ flex: 1, height: 52, background: '#2D2653', border: '1.5px solid #433B72', borderRadius: 14, fontSize: 15, fontWeight: 600, color: '#A8A3C7', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Back</motion.button>
                    <div style={{ flex: 2 }}>
                      <GradientButton onClick={scanning ? captureFace : startCamera} loading={loading} fullWidth>
                        {scanning ? 'Capture Face' : 'Start Camera'}
                      </GradientButton>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: '#6E6893', textAlign: 'center', marginTop: 10 }}>Ensure good lighting. Look directly at the camera.</p>
                </OnboardingCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
