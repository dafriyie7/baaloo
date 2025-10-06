import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";

export function useQrScanner() {
	const [scanResult, setScanResult] = useState(null);
	const [scanning, setScanning] = useState(false);
	const scannerRef = useRef(null);

	useEffect(() => {
		if (!scannerRef.current) {
			scannerRef.current = new Html5Qrcode("reader");
		}

		const scanner = scannerRef.current;

		return () => {
			if (scanner && scanner.isScanning) {
				scanner
					.stop()
					.catch((err) =>
						console.error("Failed to stop scanner on unmount", err)
					);
			}
		};
	}, []);

	const stopScan = async () => {
		if (scannerRef.current && scannerRef.current.isScanning) {
			try {
				await scannerRef.current.stop();
				setScanning(false);
			} catch (err) {
				console.error("Failed to stop scanner", err);
			}
		}
	};

	const handleSuccess = (decodedText) => {
		setScanResult(decodedText);
		stopScan();
	};

	const startScan = async () => {
		if (scannerRef.current && !scannerRef.current.isScanning) {
			try {
				setScanning(true);
				await scannerRef.current.start(
					{ facingMode: "environment" },
					{
						fps: 10,
						qrbox: (viewfinderWidth, viewfinderHeight) => {
							const minEdge = Math.min(
								viewfinderWidth,
								viewfinderHeight
							);
							const size = Math.floor(minEdge * 0.8);
							return { width: size, height: size };
						},
					},
					handleSuccess,
					() => {} // qrCodeErrorCallback
				);
			} catch (err) {
				console.error("Failed to start scanner", err);
				setScanning(false);
			}
		}
	};

	const scanFile = async (file) => {
		if (scannerRef.current && file) {
			try {
				const result = await scannerRef.current.scanFile(file, false);
				handleSuccess(result);
			} catch (err) {
				console.error("Error scanning image file.", err);
				throw new Error("Could not detect QR code in this image.");
			}
		}
	};

	const reset = () => {
		setScanResult(null);
	};

	return { scanResult, scanning, startScan, stopScan, scanFile, reset };
}
