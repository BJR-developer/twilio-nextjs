import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { VoiceResponse } from 'twilio/lib/twiml/VoiceResponse';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const apiKey = process.env.TWILIO_API_KEY;
const apiSecret = process.env.TWILIO_API_SECRET;
const client = twilio(apiKey, apiSecret, { accountSid });

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();
    
    // Create TwiML response
    const twiml = new VoiceResponse();
    twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER!,
    }, phoneNumber);

    // Make the call
    const call = await client.calls.create({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER!,
      twiml: twiml.toString(),
    });

    return NextResponse.json({ success: true, callSid: call.sid });
  } catch (error: any) {
    console.error('Error making call:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to make call' },
      { status: 500 }
    );
  }
}

// Handle incoming voice calls
export async function GET(req: Request) {
  const twiml = new VoiceResponse();
  
  // Add basic voice response
  twiml.say('Thanks for calling! Please wait while we connect your call.');
  
  return new NextResponse(twiml.toString(), {
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}