/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Device } from "@twilio/voice-sdk";

const HomePage = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<Device | null>(null);
  const [call, setCall] = useState<any>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

  useEffect(() => {
    // Initialize Twilio Device
    const initializeDevice = async () => {
      try {
        const response = await fetch("/api/token");
        const data = await response.json();

        if (data.token) {
          const newDevice = new Device(data.token);

          newDevice.on("registered", () =>
            setStatus("✅ Device ready for calls")
          );
          newDevice.on("error", (error) =>
            setStatus(`❌ Device error: ${error.message}`)
          );

          await newDevice.register();
          setDevice(newDevice);

          // Check for microphone permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          stream.getTracks().forEach((track) => track.stop());
          setIsMicrophoneEnabled(true);
        }
      } catch (error) {
        console.error("Device initialization error:", error);
        setStatus(
          "❌ Failed to initialize device. Please check microphone permissions."
        );
      }
    };

    initializeDevice();

    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const makeCall = async () => {
    if (!device || !isMicrophoneEnabled) {
      setStatus("❌ Device not ready or microphone not enabled");
      return;
    }

    if (!phoneNumber) {
      setStatus("❌ Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setStatus("📞 Starting call...");

    try {
      const newCall = await device.connect({
        params: {
          To: phoneNumber,
        },
      });

      newCall.on("accept", () => setStatus("📞 Call in progress"));
      newCall.on("disconnect", () => {
        setStatus("Call ended");
        setCall(null);
      });
      newCall.on("error", (error) =>
        setStatus(`❌ Call error: ${error.message}`)
      );

      setCall(newCall);
    } catch (error: any) {
      setStatus(`❌ Call failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = () => {
    if (call) {
      call.disconnect();
      setCall(null);
      setStatus("Call ended");
    }
  };

  const sendMessage = async () => {
    if (!phoneNumber || !message) {
      setStatus("❌ Please enter both phone number and message");
      return;
    }

    setIsLoading(true);
    setStatus("💬 Sending message...");

    try {
      const response = await fetch("/api/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: phoneNumber, message }),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(`✅ Message sent! SID: ${data.messageSid}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus("❌ Failed to send message. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Twilio Communication
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading || !!call}
            />
            <p className="mt-1 text-sm text-gray-500">
              Use international format (e.g., +1234567890)
            </p>
          </div>

          {/* Voice Calling Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Voice Call
            </h2>
            <div className="flex space-x-4">
              {!call ? (
                <button
                  onClick={makeCall}
                  disabled={isLoading || !device || !isMicrophoneEnabled}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? "Connecting..." : "📞 Start Call"}
                </button>
              ) : (
                <button
                  onClick={endCall}
                  className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200"
                >
                  End Call
                </button>
              )}
            </div>
          </div>

          {/* Messaging Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Send Message
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? "Sending..." : "💬 Send SMS"}
              </button>
            </div>
          </div>

          {status && (
            <div
              className={`mt-4 p-4 rounded-lg text-sm ${
                status.includes("❌")
                  ? "bg-red-50 text-red-700"
                  : status.includes("📞")
                  ? "bg-blue-50 text-blue-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
