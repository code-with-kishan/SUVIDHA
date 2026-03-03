const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const routeGuides = {
  '/login': [
    'Step 1: Enter Full Name.',
    'Step 2: Enter 10-digit Mobile Number.',
    'Step 3: Enter Email Address.',
    'Step 4: Enter 12-digit Aadhaar Number.',
    'Step 5: Click Send OTP.',
    'Step 6: Enter OTP and click Verify OTP.'
  ],
  '/services': [
    'Step 1: Select service type.',
    'Step 2: Fill request description.',
    'Step 3: Click Submit Service Request.',
    'Step 4: Note the generated request ID.'
  ],
  '/complaints': [
    'Step 1: Select complaint category.',
    'Step 2: Fill complaint description.',
    'Step 3: Click Submit Complaint.',
    'Step 4: Save the complaint ID for tracking.'
  ],
  '/payment': [
    'Step 1: Select service type.',
    'Step 2: Enter payment amount.',
    'Step 3: Click Create Payment.',
    'Step 4: Mark Success or Failed.',
    'Step 5: Download receipt if available.'
  ],
  '/status-tracking': [
    'Step 1: Open Status Tracking page.',
    'Step 2: Enter request/complaint ID.',
    'Step 3: Submit to view latest status.'
  ],
  '/upload-documents': [
    'Step 1: Select document type.',
    'Step 2: Upload required file.',
    'Step 3: Submit and confirm upload status.'
  ]
};

const generalAnswers = [
  {
    test: (q) => /(hello|hi|hey|hii|namaste|नमस्ते)/.test(q),
    answer: 'Hello 👋 I am Suvidha. I can guide you step-by-step for login, service requests, complaints, payments, tracking, and documents.'
  },
  {
    test: (q) => /(how are you|कैसे हो|कैसी हो)/.test(q),
    answer: 'I am great and ready to help you. Tell me which page you are on, and I will give exact steps.'
  },
  {
    test: (q) => /(who are you|what are you|तुम कौन हो|आप कौन हैं)/.test(q),
    answer:
      'I am Suvidha, your offline assistant. I work without API calls and use preloaded website guidance for kiosk help.'
  },
  {
    test: (q) => /(where|kahan|कहाँ).*login|login.*where/.test(q),
    answer: 'Open Citizen Login from the top navigation menu. Then follow steps: Name → Mobile → Email → Aadhaar → Send OTP → Verify OTP.'
  },
  {
    test: (q) => /(keyboard|keypad|typing|type|toggle keyboard|कीबोर्ड)/.test(q),
    answer: 'Use the Toggle Keyboard button on forms. In this chat, click Toggle Keyboard to open the unique on-screen keyboard for typing.'
  },
  {
    test: (q) => /(offline|internet|network)/.test(q),
    answer: 'This assistant runs fully offline with pre-stored guidance. No external API is required for chat responses.'
  }
];

const pageHint = (path) => {
  if (path.startsWith('/services')) return 'services';
  if (path.startsWith('/complaints')) return 'complaints';
  if (path.startsWith('/payment')) return 'payment';
  if (path.startsWith('/status-tracking')) return 'tracking';
  if (path.startsWith('/upload-documents')) return 'documents';
  if (path.startsWith('/login')) return 'login';
  return 'dashboard';
};

const guideByQuery = (q, path) => {
  if (/(login|otp|aadhaar|mobile|email)/.test(q)) return routeGuides['/login'];
  if (/(service|request)/.test(q)) return routeGuides['/services'];
  if (/(complaint|issue|problem)/.test(q)) return routeGuides['/complaints'];
  if (/(payment|bill|receipt)/.test(q)) return routeGuides['/payment'];
  if (/(track|status)/.test(q)) return routeGuides['/status-tracking'];
  if (/(document|upload)/.test(q)) return routeGuides['/upload-documents'];

  const matchingRoute = Object.keys(routeGuides).find((key) => path.startsWith(key));
  if (matchingRoute) return routeGuides[matchingRoute];
  return null;
};

export const getOfflineAssistantReply = ({ query, currentPath = '/' }) => {
  const q = normalize(query);
  if (!q) {
    return 'Please type your question. Example: how to fill complaint form step by step.';
  }

  const general = generalAnswers.find((item) => item.test(q));
  if (general) return general.answer;

  const strictSteps = guideByQuery(q, currentPath);
  if (strictSteps?.length) {
    return `Strict Steps:\n${strictSteps.map((step) => `• ${step}`).join('\n')}`;
  }

  return `I can help with strict steps for login, services, complaints, payments, tracking, and documents. You are currently on ${pageHint(currentPath)} page. Ask: "how to fill this form".`;
};

export const offlineAssistantQuickPrompts = [
  'How to fill complaint form?',
  'How to fill service request?',
  'How to pay bill step by step?',
  'How to complete login with OTP?',
  'Hi'
];
