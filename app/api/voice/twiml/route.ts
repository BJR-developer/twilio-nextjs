import { NextResponse } from 'next/server';
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    
    console.log('Received call request:', { to, from });
    
    const twiml = new VoiceResponse();
    
    if (from.startsWith('client:')) {
      // Outbound call from browser to phone
      twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER!,
      }, to);
    } else {
      // Inbound call or other scenarios
      twiml.say('Welcome to the Twilio voice application.');
      twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER!,
      }, to);
    }

    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  } catch (error) {
    console.error('Error generating TwiML:', error);
    const twiml = new VoiceResponse();
    twiml.say('An error occurred while processing your call.');
    
    return new NextResponse(twiml.toString(), {
      headers: {
        'Content-Type': 'text/xml',
      },
    });
  }
}
