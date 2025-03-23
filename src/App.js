import React, { useState, useRef, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import FirstFrame from "./frames/FirstFrame.png";
import SecondFrame from "./frames/SecondFrame.png";
import ThirdFrame from "./frames/ThirdFrame.png";

const FRAME_POSITIONS = [
  { top: 78, left: 72, width: 934, height: 503 },
  { top: 600, left: 72, width: 934, height: 503 },
  { top: 1120, left: 72, width: 934, height: 503 },
];

const SAVE_POSITIONS = [
  { top: 78, left: 72, width: 934, height: 503 },
  { top: 625, left: 72, width: 934, height: 503 },
  { top: 1175, left: 72, width: 934, height: 503 },
];

const Photobox = () => {
  // eslint-disable-next-line no-unused-vars
  const [isPrinting, setIsPrinting] = useState(false);
  const shutterSound = useRef(null);
  const [showFlash, setShowFlash] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);

  const handleSave = () => {
    if (!selectedFrame || photos.length < 3) return;

    const frameImage = new Image();
    frameImage.src = selectedFrame;
    frameImage.onload = () => {
      const frameWidth = frameImage.width;
      const frameHeight = frameImage.height;

      const canvas = document.createElement("canvas");
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const context = canvas.getContext("2d");

      let photosLoaded = 0;
      photos.forEach((photo, index) => {
        const img = new Image();
        img.src = photo;
        img.onload = () => {
          const { top, left, width, height } = SAVE_POSITIONS[index];
          context.drawImage(img, left, top, width, height);

          photosLoaded++;
          if (photosLoaded === photos.length) {
            context.drawImage(frameImage, 0, 0, frameWidth, frameHeight);
            const link = document.createElement("a");
            link.download = "final_photo.png";
            link.href = canvas.toDataURL("image/png");
            link.click();
          }
        };
      });
    };
  };

  useEffect(() => {
    if (step === 3 && videoRef.current) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } catch (error) {
          console.error("Error accessing the camera: ", error);
          alert(
            "Unable to access camera. Please check your camera permissions."
          );
        }
      };
      startCamera();
    }
  }, [step]);
  useEffect(() => {
    if (step === 4) {
      // eslint-disable-next-line no-unused-vars
      const triggerPrintAnimation = () => {
        const printPhoto = document.querySelector(".print-photo");
        if (printPhoto) {
          printPhoto.style.animation = "none"; // Reset animation
          void printPhoto.offsetWidth; // Trigger reflow to restart animation
          printPhoto.style.animation = "printAnimation 1.5s ease-out forwards";
        }
      };
      setIsPrinting(true); // Trigger printing animation
      const printSound = document.getElementById("print-sound");
      if (printSound) {
        printSound.play();
      }
    }
  }, [step]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Space" && step === 3 && !isCapturing) {
        startCaptureSequence();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, isCapturing]);

  const capturePhoto = () => {
    if (shutterSound.current) {
      shutterSound.current.play();
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0);

    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    return canvas.toDataURL("image/png");
  };

  const startCaptureSequence = () => {
    if (photos.length >= 3) return;
    setIsCapturing(true);
    setCountdown(3);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          const newPhoto = capturePhoto();
          const updatedPhotos = [...photos, newPhoto];

          setPhotos(updatedPhotos);
          setIsCapturing(false);
          setCountdown(null);

          if (updatedPhotos.length === 3) {
            setStep(4);
          }
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetake = () => {
    setPhotos([]);
    setStep(2);
  };

  return (
    <div className="container text-center my-5">
      {step === 1 && (
        <div>
          <h1 className="display-4 mb-4">📸 Welcome to the F1 Photobox 😎</h1>
          <button className="btn btn-primary" onClick={() => setStep(2)}>
            Start
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="mb-4">❗ Choose Your Frame ❗</h2>
          <div className="frame-container">
            {[FirstFrame, SecondFrame, ThirdFrame].map((frame, index) => (
              <div
                key={index}
                className="photo-frame"
                onClick={() => {
                  setSelectedFrame(frame);
                  setStep(3);
                }}
              >
                <img
                  src={frame}
                  alt={`Frame ${index + 1}`}
                  className="img-thumbnail"
                  style={{ width: "200px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-5">
          <div style={{ position: "relative", textAlign: "center" }}>
            <video
              ref={videoRef}
              autoPlay
              className="mb-3 border rounded"
              style={{ width: "500px" }}
            />

            {showFlash && <div className="flash-effect"></div>}

            {isCapturing && (
              <h2
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  color: "white",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  padding: "5px 10px",
                  borderRadius: "5px",
                }}
              >
                {countdown}
              </h2>
            )}
          </div>
          <div className="mt-3">
            <button
              className="btn btn-success"
              onClick={startCaptureSequence}
              disabled={isCapturing || photos.length >= 3}
            >
              {photos.length >= 3 ? "Done" : "Capture"}
            </button>
            <p style={{ marginTop: "10px", color: "#888" }}>
              Or hit <strong>Spacebar</strong> to capture.
            </p>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={{ textAlign: "center", marginTop: "150px" }}>
          <h1> Your photos </h1>
          <div style={{ marginTop: "10px" }}>
            <button
              className="btn btn-warning"
              onClick={handleRetake}
              style={{ marginRight: "10px" }}
            >
              Retake
            </button>
            <button className="btn btn-success" onClick={handleSave}>
              Save
            </button>
          </div>

          {/* Printing Animation Container */}
          <div className="print-container">
            <div className="print-hole"></div>
            <div className="print-photo">
              <div
                className="photo-print-wrapper"
                style={{
                  position: "relative",
                  display: "inline-block",
                  border: "1px solid #ddd",
                  padding: "10px",
                  backgroundColor: "#fff",
                  width: "380px",
                }}
              >
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Captured ${index + 1}`}
                    style={{
                      position: "absolute",
                      top: FRAME_POSITIONS[index].top / 2.8,
                      left: FRAME_POSITIONS[index].left / 2.8,
                      width: FRAME_POSITIONS[index].width / 2.8,
                      height: FRAME_POSITIONS[index].height / 2.8,
                      zIndex: 1,
                    }}
                  />
                ))}
                <img
                  src={selectedFrame}
                  alt="Selected Frame"
                  style={{ width: "100%", position: "relative", zIndex: 2 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <audio ref={shutterSound} src="/shutter.mp3" />
      <audio id="print-sound" src="/Print.mp3" />
    </div>
  );
};

export default Photobox;
