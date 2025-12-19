import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InquiryRequest {
  name: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Send inquiry function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, inquiryType, message }: InquiryRequest = await req.json();

    console.log("Processing inquiry:", { name, email, inquiryType });

    // Validate required fields
    if (!name || !email || !inquiryType) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Name, email, and inquiry type are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send notification email to admin
    const adminEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Chin Bethel Church <onboarding@resend.dev>",
        to: ["Admin@chinbethelchurch.com"],
        subject: `New Inquiry: ${inquiryType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
              New ${inquiryType} Inquiry
            </h2>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Contact Information</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            </div>
            
            <div style="background-color: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Inquiry Details</h3>
              <p><strong>Interest Area:</strong> ${inquiryType}</p>
              ${message ? `<p><strong>Message:</strong></p><p style="white-space: pre-wrap;">${message}</p>` : '<p><em>No additional message provided</em></p>'}
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              This inquiry was submitted through the Chin Bethel Church website.
            </p>
          </div>
        `,
      }),
    });

    const adminResult = await adminEmailResponse.json();
    console.log("Admin email sent:", adminResult);

    if (!adminEmailResponse.ok) {
      throw new Error(`Failed to send admin email: ${JSON.stringify(adminResult)}`);
    }

    // Send confirmation email to the person who submitted the inquiry
    const confirmationEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Chin Bethel Church <onboarding@resend.dev>",
        to: [email],
        subject: `Thank you for your interest - ${inquiryType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">Thank You, ${name}!</h2>
            
            <p>We have received your inquiry about <strong>${inquiryType}</strong>.</p>
            
            <p>Our team will review your request and get back to you as soon as possible. We're excited about your interest in getting involved with our church family!</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">What happens next?</h3>
              <ul>
                <li>A team member will contact you within 2-3 business days</li>
                <li>You may receive additional information about ${inquiryType}</li>
                <li>Feel free to reply to this email if you have any questions</li>
              </ul>
            </div>
            
            <p>God bless you!</p>
            
            <p style="color: #666;">
              <strong>Chin Bethel Church</strong><br>
              <a href="https://chinbethelchurch.com" style="color: #1e3a5f;">chinbethelchurch.com</a>
            </p>
          </div>
        `,
      }),
    });

    const confirmResult = await confirmationEmailResponse.json();
    console.log("Confirmation email sent:", confirmResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Inquiry submitted successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
