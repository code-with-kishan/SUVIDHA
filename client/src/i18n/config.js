import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appTitle: 'SUVIDHA Digital Helpdesk',
      welcome: 'Welcome',
      dashboard: 'Dashboard',
      login: 'Login',
      language: 'Language',
      complaints: 'Complaints',
      uploadDocs: 'Upload Documents',
      payment: 'Payment',
      tracking: 'Status Tracking',
      receipt: 'Receipt',
      admin: 'Admin'
    }
  },
  hi: {
    translation: {
      appTitle: 'सुविधा डिजिटल हेल्पडेस्क',
      welcome: 'स्वागत है',
      dashboard: 'डैशबोर्ड',
      login: 'लॉगिन',
      language: 'भाषा',
      complaints: 'शिकायतें',
      uploadDocs: 'दस्तावेज़ अपलोड',
      payment: 'भुगतान',
      tracking: 'स्थिति ट्रैकिंग',
      receipt: 'रसीद',
      admin: 'एडमिन'
    }
  },
  mr: {
    translation: {
      appTitle: 'सुविधा डिजिटल हेल्पडेस्क',
      welcome: 'स्वागत',
      dashboard: 'डॅशबोर्ड',
      login: 'लॉगिन',
      language: 'भाषा',
      complaints: 'तक्रारी',
      uploadDocs: 'दस्तऐवज अपलोड',
      payment: 'पेमेंट',
      tracking: 'स्थिती ट्रॅकिंग',
      receipt: 'पावती',
      admin: 'अॅडमिन'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('suvidha_lang') || 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
