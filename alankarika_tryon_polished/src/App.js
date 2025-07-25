import React, { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import Webcam from "react-webcam";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl";
import "./styles.css";

function TryOnModel({ position }) {
  const { scene } = useGLTF("/earring.glb");
  return <primitive object={scene} scale={0.5} position={position} />;
}

function Viewer({ landmark }) {
  const ref = useRef();
  useFrame(() => {
    if (landmark && ref.current) {
      ref.current.position.set(landmark[0], landmark[1], landmark[2]);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.05, 32, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}

export default function App() {
  const webcamRef = useRef(null);
  const [landmark, setLandmark] = React.useState(null);

  useEffect(() => {
    async function loadModel() {
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
      );
      const detect = async () => {
        if (
          typeof webcamRef.current !== "undefined" &&
          webcamRef.current !== null &&
          webcamRef.current.video.readyState === 4
        ) {
          const video = webcamRef.current.video;
          const predictions = await model.estimateFaces({ input: video });

          if (predictions.length > 0) {
            const keypoint = predictions[0].scaledMesh[234]; // Near left ear
            setLandmark([
              (keypoint[0] - 320) / 80,
              -(keypoint[1] - 240) / 80,
              -0.5,
            ]);
          }
        }
        requestAnimationFrame(detect);
      };
      detect();
    }
    loadModel();
  }, []);

  return (
    <div className="app">
      <div className="header">
        <h1>Alankarikā</h1>
        <p>Reimagining the jewelry experience with AI-powered virtual try-ons.</p>
      </div>
      <Webcam ref={webcamRef} className="webcam" mirrored />
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight />
        <directionalLight position={[0, 0, 5]} />
        {landmark && <Viewer landmark={landmark} />}
        {landmark && <TryOnModel position={landmark} />}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
