const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE');
const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash', generationConfig: { responseMimeType: 'application/json' }});
async function test() {
  try {
    console.log('Sending request to Gemini...');
    const prompt = 'Analyze this complaint: My table screw is missing and unable to use the table properly for my study purpose. Category: Hostel Facilities. Return JSON: { "predictedPriority": "low|medium|high|emergency", "confidence": 0.5, "sentimentScore": 0.5 }';
    const result = await model.generateContent(prompt);
    console.log('Success:', result.response.text());
  } catch (error) {
    console.error('API Error:', error.message);
  }
}
test();
