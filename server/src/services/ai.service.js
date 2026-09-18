const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const MODEL_NAME = 'gemini-3.6-flash';

const isAIEnabled = () => {
  return !!genAI;
};

const getModel = () => {
  if (!genAI) return null;
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  });
};

const getDepartmentFromCategory = (category) => {
  const map = {
    electrical: 'Electrical Maintenance',
    plumbing: 'Plumbing & Civil',
    internet_connectivity: 'IT Department',
    classroom_equipment: 'Academic Affairs',
    laboratory_equipment: 'Laboratory Management',
    hostel_facilities: 'Hostel Administration',
    transportation: 'Transport Department',
    food_services: 'Mess & Canteen',
    security: 'Security Department',
    housekeeping: 'Housekeeping',
    academic_grievance: 'Academic Affairs',
    examination: 'Examination Cell',
    library: 'Library',
    sports_facilities: 'Sports Department',
    medical: 'Medical Center',
    civil_maintenance: 'Civil Maintenance',
    general_administration: 'Administration',
    other: 'Administration',
  };
  return map[category] || 'Administration';
};

const analyzeComplaint = async (complaint) => {
  const fallback = {
    suggestedCategory: complaint.category,
    suggestedDepartment: getDepartmentFromCategory(complaint.category),
    predictedPriority: 'medium',
    sentimentScore: 0.5,
    isDuplicate: false,
    summary: complaint.description.substring(0, 100),
    confidence: 0.5,
    processed: false,
  };

  try {
    if (!isAIEnabled()) return fallback;
    const model = getModel();

    const prompt = `You are the core AI intelligence for Campus CIVORA AI at Amrita Vishwa Vidyapeetham.
Your job is to analyze a student complaint and route it accurately.

Complaint Title: ${complaint.title}
Description: ${complaint.description}
Category Selected by Student: ${complaint.category}
Location: ${complaint.location?.building || 'Not specified'}, ${complaint.location?.room || ''}

Provide a JSON response with exactly this schema:
{
  "suggestedCategory": "one of: electrical|plumbing|internet_connectivity|classroom_equipment|laboratory_equipment|hostel_facilities|transportation|food_services|security|housekeeping|academic_grievance|examination|library|sports_facilities|medical|civil_maintenance|general_administration|other",
  "suggestedDepartment": "name of the specific university department to handle this",
  "predictedPriority": "one of: low|medium|high|emergency",
  "sentimentScore": <number between 0.0 and 1.0 where 1.0 is highly urgent or angry>,
  "summary": "<2 sentence admin summary of the issue>",
  "confidence": <number between 0.0 and 1.0>,
  "isEmergency": <boolean true if this poses immediate danger to life, safety, or massive property damage>
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return {
      suggestedCategory: parsed.suggestedCategory || complaint.category,
      suggestedDepartment: parsed.suggestedDepartment || getDepartmentFromCategory(complaint.category),
      predictedPriority: parsed.predictedPriority || 'medium',
      sentimentScore: parsed.sentimentScore || 0.5,
      isDuplicate: false,
      summary: parsed.summary || complaint.description.substring(0, 100),
      confidence: parsed.confidence || 0.7,
      isEmergency: parsed.isEmergency || false,
      processed: true,
    };
  } catch (error) {
    console.warn(`⚠️  Gemini AI analysis failed: ${error.message}. Using fallback.`);
    return fallback;
  }
};

const checkDuplicate = async (newComplaint, recentComplaints) => {
  if (!recentComplaints || recentComplaints.length === 0) return null;
  try {
    if (!isAIEnabled()) return null;
    const model = getModel();

    const recentList = recentComplaints.slice(0, 5).map((c, i) =>
      `${i + 1}. [ID: ${c._id}] Category: ${c.category}, Location: ${c.location?.building}, Title: ${c.title}`
    ).join('\n');

    const prompt = `You are an AI assistant checking if a new complaint is a duplicate of existing ones.

New complaint: 
Category: ${newComplaint.category}
Location: ${newComplaint.location?.building} ${newComplaint.location?.room}
Title: ${newComplaint.title}
Description: ${newComplaint.description.substring(0, 200)}

Recent complaints in the same area:
${recentList}

Is the new complaint a duplicate of any existing one? 
Respond with a JSON object with this schema:
{
  "isDuplicate": <boolean>,
  "duplicateOfIndex": <number, the 1-based index from the list above, or null>,
  "reason": "<brief explanation why>"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    if (parsed.isDuplicate && parsed.duplicateOfIndex) {
      const idx = parseInt(parsed.duplicateOfIndex) - 1;
      if (recentComplaints[idx]) return recentComplaints[idx]._id;
    }
    return null;
  } catch (err) {
    console.warn(`⚠️  Gemini duplicate check failed: ${err.message}`);
    return null;
  }
};

const analyzePetition = async (petition) => {
  try {
    if (!isAIEnabled()) return { summary: petition.description.substring(0, 100), isDuplicate: false, tags: [] };
    const model = getModel();

    const prompt = `Summarize this university petition for administrators. 
Title: ${petition.title}
Description: ${petition.description}
Purpose: ${petition.purpose}

Respond with a JSON object with this schema:
{
  "summary": "<3 sentence concise summary>",
  "tags": ["<tag1>", "<tag2>", "<tag3>"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return { summary: parsed.summary, tags: parsed.tags || [], isDuplicate: false };
  } catch {
    return { summary: petition.description.substring(0, 100), isDuplicate: false, tags: [] };
  }
};

const matchLostFound = async (lostItem, foundItems) => {
  if (!foundItems || foundItems.length === 0) return [];
  try {
    if (!isAIEnabled()) return [];
    const model = getModel();

    const foundList = foundItems.slice(0, 5).map((f, i) =>
      `${i + 1}. [ID: ${f._id}] Category: ${f.itemCategory}, Description: ${f.description}, Location: ${f.foundLocation}`
    ).join('\n');

    const prompt = `Match this lost item against found items in the database. 
Lost Item: 
Category: ${lostItem.itemCategory}
Description: ${lostItem.description}
Color: ${lostItem.color}
Brand: ${lostItem.brand}

Found items:
${foundList}

Which found items potentially match? 
Respond with a JSON object with this schema:
{
  "matches": [
    {
      "index": <1-based index from the list>,
      "score": <number between 0.0 and 1.0 indicating confidence>,
      "reason": "<why they match>"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    return (parsed.matches || [])
      .filter((m) => m.score >= 0.6)
      .map((m) => ({
        matchedReportId: foundItems[parseInt(m.index) - 1]?._id,
        matchScore: m.score,
      }))
      .filter((m) => m.matchedReportId);
  } catch {
    return [];
  }
};

module.exports = { analyzeComplaint, checkDuplicate, analyzePetition, matchLostFound, getDepartmentFromCategory };
