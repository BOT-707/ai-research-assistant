import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    
    const botToken = formData.get('botToken') as string;
    const channelId = formData.get('channelId') as string;
    const applicantName = formData.get('applicantName') as string;
    const applicantEmail = formData.get('applicantEmail') as string;
    const companyName = formData.get('companyName') as string;
    const companyWebsite = formData.get('companyWebsite') as string;
    const file = formData.get('file') as Blob;
    
    if (!botToken || !channelId || !file) {
      return NextResponse.json({ error: 'Missing Discord Token, Channel ID, or File' }, { status: 400 });
    }
    
    const messageContent = `**New Research Report**\n\n**Applicant Name:** ${applicantName || 'N/A'}\n**Applicant Email:** ${applicantEmail || 'N/A'}\n**Company:** ${companyName}\n**Website:** ${companyWebsite || 'N/A'}`;
    
    const discordFormData = new FormData();
    discordFormData.append('content', messageContent);
    discordFormData.append('file', file, `${companyName.replace(/\s+/g, '_')}_Research_Report.pdf`);
    
    const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${botToken}`,
      },
      body: discordFormData,
    });
    
    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('Discord Error:', errText);
      return NextResponse.json({ error: `Discord API Error: ${discordRes.status}` }, { status: discordRes.status });
    }
    
    const discordData = await discordRes.json();
    return NextResponse.json({ success: true, data: discordData });
    
  } catch (error: any) {
    console.error('Discord API Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
