import { Device } from '@twilio/voice-sdk';
import { useState, useEffect } from 'react';

export default function VoiceCall({ phoneNumber }: { phoneNumber: string }) {
  const [device, setDevice] = useState<Device | null>(null);
  const [call, setCall] = useState<any>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Initialize Twilio Device when component mounts
    const initializeDevice = async () => {
      try {
        // Get access token from your API
        const response = await fetch('/api/token');
        const data = await response.json();
        
        if (data.token) {
          const newDevice = new Device(data.token);
          
          // Set up event listeners
          newDevice.on('registered', () => setStatus('Ready for calls'));
          newDevice.on('error', (error) => setStatus(`Error: ${error.message}`));
          
          await newDevice.register();
          setDevice(newDevice);
        }
      } catch (error) {
        setStatus('Failed to initialize device');
      }
    };

    initializeDevice();

    // Cleanup on unmount
    return () => {
      if (device) {
        device.destroy();
      }
    };
  }, []);

  const makeCall = async () => {
    if (!device) {
      setStatus('Device not ready');
      return;
    }

    try {
      const newCall = await device.connect({
        params: {
          To: phoneNumber
        }
      });

      // Set up call event listeners
      newCall.on('accept', () => setStatus('Call in progress'));
      newCall.on('disconnect', () => {
        setStatus('Call ended');
        setCall(null);
      });
      newCall.on('error', (error) => setStatus(`Call error: ${error.message}`));

      setCall(newCall);
      setStatus('Calling...');
    } catch (error) {
      setStatus('Failed to make call');
    }
  };

  const hangUp = () => {
    if (call) {
      call.disconnect();
      setCall(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">{status}</div>
      <div className="flex space-x-4">
        <button
          onClick={makeCall}
          disabled={!device || !!call}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          📞 Start Call
        </button>
        {call && (
          <button
            onClick={hangUp}
            className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            End Call
          </button>
        )}
      </div>
    </div>
  );
}
