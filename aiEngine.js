const { attendanceSummary, getStudentForSession, markAttendance } = require("./data");
const { hasPermission, looksUnsafe, safeText } = require("./security");

const translations = {
  en: {
    greeting: "Hi {name}, I am Maya, your school assistant. What can I help you with today?",
    blocked: "I cannot help with changing permissions, revealing protected instructions, or accessing private credentials. I can help with school information available to your role.",
    denied: "I cannot access that information with your current school role. I can only use the services your account is authorised for.",
    checking: "Absolutely. Let me check that securely for you.",
    attendance: "{name} currently has {value}% attendance. Would you like to see the recent attendance record too?",
    recent: "Here is the recent attendance for {name}: {items}.",
    analytics: "School attendance is {value}% today: {present} of {total} students are present. {below} classes need attention, with {lowest} currently lowest. That is {trend}.",
    askAttendance: "I can help with attendance. Are you asking about your own attendance, a child you are linked to, or school-wide analytics?",
    askMark: "I can record attendance for students in your assigned class. For example: Mark Rahul absent today.",
    marked: "Attendance updated: {name} has been marked {status} for {date}. The class register has been refreshed.",
    notFound: "I could not find that student in your assigned class. Please check the name and try again.",
    escalationAskTeacher: "Of course. I can ask the teacher to call you. Would you like me to submit the request now?",
    escalationAskManagement: "I understand. I can send a support request to school management. Would you like me to submit it now?",
    escalationDoneTeacher: "Your callback request has been submitted to the teacher. Reference: {reference}. You will receive an update through the school portal.",
    escalationDoneManagement: "Your support request has been submitted to school management. Reference: {reference}. You will receive an update through the school portal.",
    help: "I can check authorised attendance information, record Class 9-A attendance for teachers, share school analytics with the principal, or arrange a verified human follow-up."
  },
  hi: {
    greeting: "नमस्ते {name}, मैं Maya हूँ, आपकी स्कूल सहायक। आज मैं आपकी क्या मदद कर सकती हूँ?",
    blocked: "मैं अनुमतियाँ बदलने, सुरक्षित निर्देश बताने या निजी जानकारी देने में मदद नहीं कर सकती।",
    denied: "आपकी वर्तमान स्कूल भूमिका के लिए यह जानकारी उपलब्ध नहीं है।",
    checking: "ज़रूर, मैं इसे सुरक्षित रूप से देखती हूँ।",
    attendance: "{name} की वर्तमान उपस्थिति {value}% है। क्या आप हाल की उपस्थिति भी देखना चाहेंगे?",
    recent: "{name} की हाल की उपस्थिति: {items}।",
    analytics: "आज स्कूल की उपस्थिति {value}% है: {total} में से {present} विद्यार्थी उपस्थित हैं। {below} कक्षाओं पर ध्यान चाहिए।",
    askAttendance: "मैं उपस्थिति में मदद कर सकती हूँ। आप अपनी, बच्चे की, या स्कूल की उपस्थिति जानना चाहते हैं?",
    askMark: "मैं आपकी कक्षा के विद्यार्थियों की उपस्थिति दर्ज कर सकती हूँ।",
    marked: "उपस्थिति अपडेट हो गई: {name} को {date} के लिए {status} दर्ज किया गया है।",
    notFound: "मुझे आपकी कक्षा में वह विद्यार्थी नहीं मिला।",
    escalationAskTeacher: "ज़रूर, मैं शिक्षक से कॉल का अनुरोध कर सकती हूँ। क्या मैं अभी अनुरोध भेज दूँ?",
    escalationAskManagement: "मैं स्कूल प्रबंधन को सहायता अनुरोध भेज सकती हूँ। क्या मैं इसे अभी भेज दूँ?",
    escalationDoneTeacher: "शिक्षक को आपका कॉल अनुरोध भेज दिया गया है। संदर्भ: {reference}।",
    escalationDoneManagement: "स्कूल प्रबंधन को आपका सहायता अनुरोध भेज दिया गया है। संदर्भ: {reference}।",
    help: "मैं आपकी अनुमतियों के अनुसार उपस्थिति, कक्षा रजिस्टर और मानव सहायता में मदद कर सकती हूँ।"
  },
  ta: { greeting: "வணக்கம் {name}, நான் உங்கள் பள்ளி உதவியாளர் Maya. இன்று நான் எப்படி உதவலாம்?", blocked: "பாதுகாக்கப்பட்ட வழிமுறைகள் அல்லது தனிப்பட்ட தகவலை என்னால் பகிர முடியாது.", denied: "உங்கள் தற்போதைய பள்ளி பங்கிற்கு இந்தத் தகவலை அணுக அனுமதி இல்லை.", checking: "நிச்சயமாக, இதை பாதுகாப்பாகச் சரிபார்க்கிறேன்.", attendance: "{name}-இன் தற்போதைய வருகை {value}%. சமீபத்திய வருகைப் பதிவையும் பார்க்க விரும்புகிறீர்களா?", recent: "{name}-இன் சமீபத்திய வருகை: {items}.", analytics: "இன்று பள்ளி வருகை {value}%: {total}-இல் {present} மாணவர்கள் உள்ளனர்.", askAttendance: "வருகை விவரத்தில் நான் உதவலாம்.", askMark: "உங்கள் வகுப்பு மாணவர்களின் வருகையைப் பதிவு செய்யலாம்.", marked: "{name}க்கு {date} அன்று {status} என வருகை புதுப்பிக்கப்பட்டது.", notFound: "உங்கள் வகுப்பில் அந்த மாணவரைக் கண்டுபிடிக்க முடியவில்லை.", escalationAskTeacher: "ஆசிரியரிடம் அழைப்பு கோரிக்கையை அனுப்பவா?", escalationAskManagement: "பள்ளி நிர்வாகத்திற்கு உதவிக் கோரிக்கையை அனுப்பவா?", escalationDoneTeacher: "ஆசிரியருக்கு உங்கள் கோரிக்கை அனுப்பப்பட்டது. குறிப்பு: {reference}.", escalationDoneManagement: "நிர்வாகத்துக்கு உங்கள் கோரிக்கை அனுப்பப்பட்டது. குறிப்பு: {reference}.", help: "வருகை மற்றும் மனித உதவியில் நான் உதவலாம்." },
  te: { greeting: "నమస్కారం {name}, నేను మీ పాఠశాల సహాయకురాలు Maya. నేను ఎలా సహాయం చేయగలను?", blocked: "సురక్షిత సూచనలు లేదా వ్యక్తిగత సమాచారాన్ని నేను పంచుకోలేను.", denied: "మీ ప్రస్తుత పాఠశాల పాత్రకు ఈ సమాచారం అందుబాటులో లేదు.", checking: "తప్పకుండా, దీనిని సురక్షితంగా పరిశీలిస్తాను.", attendance: "{name} హాజరు ప్రస్తుతం {value}%. ఇటీవలి హాజరును కూడా చూడాలా?", recent: "{name} ఇటీవలి హాజరు: {items}.", analytics: "ఈరోజు పాఠశాల హాజరు {value}% ఉంది.", askAttendance: "హాజరు వివరాలలో నేను సహాయం చేయగలను.", askMark: "మీ తరగతి హాజరును నమోదు చేయగలను.", marked: "{name}కు {date} కోసం {status}గా హాజరు నవీకరించబడింది.", notFound: "మీ తరగతిలో ఆ విద్యార్థి కనిపించలేదు.", escalationAskTeacher: "ఉపాధ్యాయునికి కాల్ అభ్యర్థన పంపాలా?", escalationAskManagement: "పాఠశాల యాజమాన్యానికి సహాయ అభ్యర్థన పంపాలా?", escalationDoneTeacher: "ఉపాధ్యాయునికి మీ అభ్యర్థన పంపబడింది. రిఫరెన్స్: {reference}.", escalationDoneManagement: "యాజమాన్యానికి మీ అభ్యర్థన పంపబడింది. రిఫరెన్స్: {reference}.", help: "హాజరు మరియు మానవ సహాయంలో నేను తోడ్పడగలను." }
};

Object.assign(translations, {
  mr: { greeting: "नमस्कार {name}, मी Maya आहे, तुमची शाळेची सहाय्यक. आज मी कशी मदत करू?", blocked: "मी सुरक्षित सूचना किंवा खासगी माहिती उघड करू शकत नाही.", denied: "तुमच्या सध्याच्या शाळेच्या भूमिकेसाठी ही माहिती उपलब्ध नाही.", checking: "नक्कीच, मी हे सुरक्षितपणे तपासते.", attendance: "{name} यांची सध्याची उपस्थिती {value}% आहे. अलीकडची उपस्थितीही पाहायची आहे का?", recent: "{name} यांची अलीकडची उपस्थिती: {items}.", analytics: "आज शाळेची उपस्थिती {value}% आहे: {total} पैकी {present} विद्यार्थी उपस्थित आहेत. {below} वर्गांना लक्ष देणे आवश्यक आहे.", askAttendance: "मी उपस्थितीविषयी मदत करू शकते.", askMark: "मी तुमच्या वर्गातील विद्यार्थ्यांची उपस्थिती नोंदवू शकते.", marked: "{name} यांची {date} ची उपस्थिती {status} म्हणून अपडेट झाली आहे.", notFound: "तुमच्या वर्गात तो विद्यार्थी सापडला नाही.", escalationAskTeacher: "मी शिक्षकांना कॉलची विनंती पाठवू का?", escalationAskManagement: "मी शाळा व्यवस्थापनाला मदत-विनंती पाठवू का?", escalationDoneTeacher: "शिक्षकांना तुमची विनंती पाठवली आहे. संदर्भ: {reference}.", escalationDoneManagement: "व्यवस्थापनाला तुमची विनंती पाठवली आहे. संदर्भ: {reference}.", help: "मी उपस्थिती आणि मानवी मदतीबाबत सहाय्य करू शकते." },
  bn: { greeting: "নমস্কার {name}, আমি Maya, আপনার স্কুল সহায়ক। আজ কীভাবে সাহায্য করতে পারি?", blocked: "আমি সুরক্ষিত নির্দেশনা বা ব্যক্তিগত তথ্য প্রকাশ করতে পারি না।", denied: "আপনার বর্তমান স্কুল ভূমিকার জন্য এই তথ্য অনুমোদিত নয়।", checking: "অবশ্যই, আমি এটি নিরাপদে যাচাই করছি।", attendance: "{name}-এর বর্তমান উপস্থিতি {value}%. সাম্প্রতিক উপস্থিতিও দেখতে চান?", recent: "{name}-এর সাম্প্রতিক উপস্থিতি: {items}।", analytics: "আজ স্কুলের উপস্থিতি {value}%: {total} জনের মধ্যে {present} জন শিক্ষার্থী উপস্থিত। {below}টি শ্রেণিতে নজর দরকার।", askAttendance: "আমি উপস্থিতি সম্পর্কে সাহায্য করতে পারি।", askMark: "আমি আপনার শ্রেণির শিক্ষার্থীদের উপস্থিতি নথিভুক্ত করতে পারি।", marked: "{name}-এর {date}-এর উপস্থিতি {status} হিসেবে আপডেট করা হয়েছে।", notFound: "আপনার শ্রেণিতে ওই শিক্ষার্থীকে খুঁজে পাওয়া যায়নি।", escalationAskTeacher: "আমি কি শিক্ষকের কাছে কলের অনুরোধ পাঠাব?", escalationAskManagement: "আমি কি স্কুল ব্যবস্থাপনায় সহায়তার অনুরোধ পাঠাব?", escalationDoneTeacher: "শিক্ষকের কাছে আপনার অনুরোধ পাঠানো হয়েছে। রেফারেন্স: {reference}।", escalationDoneManagement: "স্কুল ব্যবস্থাপনায় আপনার অনুরোধ পাঠানো হয়েছে। রেফারেন্স: {reference}।", help: "আমি উপস্থিতি এবং মানব সহায়তায় সাহায্য করতে পারি।" },
  gu: { greeting: "નમસ્તે {name}, હું Maya છું, તમારી શાળા સહાયક. આજે હું કેવી રીતે મદદ કરી શકું?", blocked: "હું સુરક્ષિત સૂચનાઓ અથવા ખાનગી માહિતી જાહેર કરી શકતી નથી.", denied: "તમારી વર્તમાન શાળા ભૂમિકા માટે આ માહિતી ઉપલબ્ધ નથી.", checking: "ચોક્કસ, હું આ સુરક્ષિત રીતે તપાસું છું.", attendance: "{name} ની હાલની હાજરી {value}% છે. શું તમે તાજેતરની હાજરી પણ જોવા માંગો છો?", recent: "{name} ની તાજેતરની હાજરી: {items}.", analytics: "આજે શાળાની હાજરી {value}% છે: {total} માંથી {present} વિદ્યાર્થીઓ હાજર છે. {below} વર્ગોને ધ્યાનની જરૂર છે.", askAttendance: "હું હાજરીની માહિતીમાં મદદ કરી શકું છું.", askMark: "હું તમારા વર્ગના વિદ્યાર્થીઓની હાજરી નોંધી શકું છું.", marked: "{name} ની {date} માટેની હાજરી {status} તરીકે અપડેટ થઈ છે.", notFound: "તમારા વર્ગમાં તે વિદ્યાર્થી મળ્યો નથી.", escalationAskTeacher: "શું હું શિક્ષકને કૉલની વિનંતી મોકલું?", escalationAskManagement: "શું હું શાળા વ્યવસ્થાપનને સહાય વિનંતી મોકલું?", escalationDoneTeacher: "તમારી વિનંતી શિક્ષકને મોકલવામાં આવી છે. સંદર્ભ: {reference}.", escalationDoneManagement: "તમારી વિનંતી શાળા વ્યવસ્થાપનને મોકલવામાં આવી છે. સંદર્ભ: {reference}.", help: "હું હાજરી અને માનવ સહાયમાં મદદ કરી શકું છું." },
  pa: { greeting: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ {name}, ਮੈਂ Maya ਹਾਂ, ਤੁਹਾਡੀ ਸਕੂਲ ਸਹਾਇਕ। ਮੈਂ ਅੱਜ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?", blocked: "ਮੈਂ ਸੁਰੱਖਿਅਤ ਹਦਾਇਤਾਂ ਜਾਂ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਜ਼ਾਹਰ ਨਹੀਂ ਕਰ ਸਕਦੀ।", denied: "ਤੁਹਾਡੀ ਮੌਜੂਦਾ ਸਕੂਲ ਭੂਮਿਕਾ ਲਈ ਇਹ ਜਾਣਕਾਰੀ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।", checking: "ਜ਼ਰੂਰ, ਮੈਂ ਇਸਨੂੰ ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਜਾਂਚ ਰਹੀ ਹਾਂ।", attendance: "{name} ਦੀ ਮੌਜੂਦਾ ਹਾਜ਼ਰੀ {value}% ਹੈ। ਕੀ ਤੁਸੀਂ ਹਾਲੀਆ ਹਾਜ਼ਰੀ ਵੀ ਦੇਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?", recent: "{name} ਦੀ ਹਾਲੀਆ ਹਾਜ਼ਰੀ: {items}।", analytics: "ਅੱਜ ਸਕੂਲ ਦੀ ਹਾਜ਼ਰੀ {value}% ਹੈ: {total} ਵਿੱਚੋਂ {present} ਵਿਦਿਆਰਥੀ ਹਾਜ਼ਰ ਹਨ। {below} ਕਲਾਸਾਂ ਨੂੰ ਧਿਆਨ ਦੀ ਲੋੜ ਹੈ।", askAttendance: "ਮੈਂ ਹਾਜ਼ਰੀ ਬਾਰੇ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ।", askMark: "ਮੈਂ ਤੁਹਾਡੀ ਕਲਾਸ ਦੇ ਵਿਦਿਆਰਥੀਆਂ ਦੀ ਹਾਜ਼ਰੀ ਦਰਜ ਕਰ ਸਕਦੀ ਹਾਂ।", marked: "{name} ਦੀ {date} ਲਈ ਹਾਜ਼ਰੀ {status} ਵਜੋਂ ਅੱਪਡੇਟ ਕੀਤੀ ਗਈ ਹੈ।", notFound: "ਤੁਹਾਡੀ ਕਲਾਸ ਵਿੱਚ ਉਹ ਵਿਦਿਆਰਥੀ ਨਹੀਂ ਮਿਲਿਆ।", escalationAskTeacher: "ਕੀ ਮੈਂ ਅਧਿਆਪਕ ਨੂੰ ਕਾਲ ਦੀ ਬੇਨਤੀ ਭੇਜਾਂ?", escalationAskManagement: "ਕੀ ਮੈਂ ਸਕੂਲ ਪ੍ਰਬੰਧਨ ਨੂੰ ਮਦਦ ਦੀ ਬੇਨਤੀ ਭੇਜਾਂ?", escalationDoneTeacher: "ਤੁਹਾਡੀ ਬੇਨਤੀ ਅਧਿਆਪਕ ਨੂੰ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ। ਹਵਾਲਾ: {reference}।", escalationDoneManagement: "ਤੁਹਾਡੀ ਬੇਨਤੀ ਸਕੂਲ ਪ੍ਰਬੰਧਨ ਨੂੰ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ। ਹਵਾਲਾ: {reference}।", help: "ਮੈਂ ਹਾਜ਼ਰੀ ਅਤੇ ਮਨੁੱਖੀ ਸਹਾਇਤਾ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ।" },
  kn: { greeting: "ನಮಸ್ಕಾರ {name}, ನಾನು ನಿಮ್ಮ ಶಾಲಾ ಸಹಾಯಕಿ Maya. ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?", blocked: "ಸುರಕ್ಷಿತ ಸೂಚನೆಗಳು ಅಥವಾ ಖಾಸಗಿ ಮಾಹಿತಿಯನ್ನು ನಾನು ಬಹಿರಂಗಪಡಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.", denied: "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಶಾಲಾ ಪಾತ್ರಕ್ಕೆ ಈ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.", checking: "ಖಂಡಿತ, ಇದನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಪರಿಶೀಲಿಸುತ್ತೇನೆ.", attendance: "{name} ಅವರ ಪ್ರಸ್ತುತ ಹಾಜರಾತಿ {value}%. ಇತ್ತೀಚಿನ ಹಾಜರಾತಿಯನ್ನೂ ನೋಡಲು ಬಯಸುವಿರಾ?", recent: "{name} ಅವರ ಇತ್ತೀಚಿನ ಹಾಜರಾತಿ: {items}.", analytics: "ಇಂದು ಶಾಲೆಯ ಹಾಜರಾತಿ {value}%: {total} ರಲ್ಲಿ {present} ವಿದ್ಯಾರ್ಥಿಗಳು ಹಾಜರಿದ್ದಾರೆ. {below} ತರಗತಿಗಳಿಗೆ ಗಮನ ಬೇಕಿದೆ.", askAttendance: "ನಾನು ಹಾಜರಾತಿ ಕುರಿತು ಸಹಾಯ ಮಾಡಬಹುದು.", askMark: "ನಿಮ್ಮ ತರಗತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳ ಹಾಜರಾತಿ ದಾಖಲಿಸಬಹುದು.", marked: "{name} ಅವರ {date} ಹಾಜರಾತಿಯನ್ನು {status} ಎಂದು ನವೀಕರಿಸಲಾಗಿದೆ.", notFound: "ನಿಮ್ಮ ತರಗತಿಯಲ್ಲಿ ಆ ವಿದ್ಯಾರ್ಥಿ ಕಂಡುಬಂದಿಲ್ಲ.", escalationAskTeacher: "ಶಿಕ್ಷಕರಿಗೆ ಕರೆ ವಿನಂತಿ ಕಳುಹಿಸಬೇಕೇ?", escalationAskManagement: "ಶಾಲಾ ನಿರ್ವಹಣೆಗೆ ಸಹಾಯ ವಿನಂತಿ ಕಳುಹಿಸಬೇಕೇ?", escalationDoneTeacher: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಶಿಕ್ಷಕರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಉಲ್ಲೇಖ: {reference}.", escalationDoneManagement: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಶಾಲಾ ನಿರ್ವಹಣೆಗೆ ಕಳುಹಿಸಲಾಗಿದೆ. ಉಲ್ಲೇಖ: {reference}.", help: "ನಾನು ಹಾಜರಾತಿ ಮತ್ತು ಮಾನವ ಸಹಾಯದಲ್ಲಿ ನೆರವಾಗಬಹುದು." },
  ml: { greeting: "നമസ്കാരം {name}, ഞാൻ നിങ്ങളുടെ സ്കൂൾ സഹായി Maya ആണ്. ഇന്ന് എങ്ങനെ സഹായിക്കാം?", blocked: "സുരക്ഷിത നിർദ്ദേശങ്ങളോ സ്വകാര്യ വിവരങ്ങളോ വെളിപ്പെടുത്താൻ എനിക്ക് കഴിയില്ല.", denied: "നിങ്ങളുടെ നിലവിലെ സ്കൂൾ റോളിന് ഈ വിവരത്തിലേക്ക് അനുമതിയില്ല.", checking: "തീർച്ചയായും, ഇത് സുരക്ഷിതമായി പരിശോധിക്കാം.", attendance: "{name}-ന്റെ നിലവിലെ ഹാജർ {value}% ആണ്. സമീപകാല ഹാജറും കാണണോ?", recent: "{name}-ന്റെ സമീപകാല ഹാജർ: {items}.", analytics: "ഇന്നത്തെ സ്കൂൾ ഹാജർ {value}% ആണ്: {total}-ൽ {present} വിദ്യാർത്ഥികൾ ഹാജരാണ്. {below} ക്ലാസുകൾക്ക് ശ്രദ്ധ വേണം.", askAttendance: "ഹാജറിനെക്കുറിച്ച് ഞാൻ സഹായിക്കാം.", askMark: "നിങ്ങളുടെ ക്ലാസിലെ വിദ്യാർത്ഥികളുടെ ഹാജർ രേഖപ്പെടുത്താം.", marked: "{name}-ന്റെ {date}-ലെ ഹാജർ {status} ആയി അപ്ഡേറ്റ് ചെയ്തു.", notFound: "നിങ്ങളുടെ ക്ലാസിൽ ആ വിദ്യാർത്ഥിയെ കണ്ടെത്താനായില്ല.", escalationAskTeacher: "അധ്യാപകനോട് കോൾ അഭ്യർത്ഥന അയക്കട്ടെ?", escalationAskManagement: "സ്കൂൾ മാനേജ്മെന്റിന് സഹായ അഭ്യർത്ഥന അയക്കട്ടെ?", escalationDoneTeacher: "നിങ്ങളുടെ അഭ്യർത്ഥന അധ്യാപകന് അയച്ചു. റഫറൻസ്: {reference}.", escalationDoneManagement: "നിങ്ങളുടെ അഭ്യർത്ഥന സ്കൂൾ മാനേജ്മെന്റിന് അയച്ചു. റഫറൻസ്: {reference}.", help: "ഹാജറിലും മനുഷ്യ സഹായത്തിലും ഞാൻ സഹായിക്കാം." },
  ur: { greeting: "السلام علیکم {name}، میں Maya ہوں، آپ کی اسکول اسسٹنٹ۔ میں آج کیسے مدد کر سکتی ہوں؟", blocked: "میں محفوظ ہدایات یا نجی معلومات ظاہر نہیں کر سکتی۔", denied: "آپ کے موجودہ اسکول کردار کے لیے یہ معلومات دستیاب نہیں ہیں۔", checking: "ضرور، میں اسے محفوظ طریقے سے چیک کرتی ہوں۔", attendance: "{name} کی موجودہ حاضری {value}% ہے۔ کیا آپ حالیہ حاضری بھی دیکھنا چاہتے ہیں؟", recent: "{name} کی حالیہ حاضری: {items}۔", analytics: "آج اسکول کی حاضری {value}% ہے: {total} میں سے {present} طلبہ حاضر ہیں۔ {below} کلاسوں کو توجہ درکار ہے۔", askAttendance: "میں حاضری کے بارے میں مدد کر سکتی ہوں۔", askMark: "میں آپ کی کلاس کے طلبہ کی حاضری درج کر سکتی ہوں۔", marked: "{name} کی {date} کی حاضری {status} کے طور پر اپ ڈیٹ کر دی گئی ہے۔", notFound: "آپ کی کلاس میں وہ طالب علم نہیں ملا۔", escalationAskTeacher: "کیا میں استاد کو کال کی درخواست بھیج دوں؟", escalationAskManagement: "کیا میں اسکول انتظامیہ کو مدد کی درخواست بھیج دوں؟", escalationDoneTeacher: "آپ کی درخواست استاد کو بھیج دی گئی ہے۔ حوالہ: {reference}۔", escalationDoneManagement: "آپ کی درخواست اسکول انتظامیہ کو بھیج دی گئی ہے۔ حوالہ: {reference}۔", help: "میں حاضری اور انسانی مدد میں معاونت کر سکتی ہوں۔" }
});

function locale(language) {
  return translations[language] || translations.en;
}

function phrase(language, key, values) {
  const template = locale(language)[key] || translations.en[key];
  return Object.entries(values || {}).reduce((result, pair) => result.replace(new RegExp("\\{" + pair[0] + "\\}", "g"), String(pair[1])), template);
}

function recentItems(student) {
  return student.recentAttendance.slice(0, 4).map((item) => item.date + " - " + item.status).join(", ");
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function normaliseStatus(text) {
  if (includesAny(text, ["present", " उपस्थित", "வருகை", "హాజరు"])) return "present";
  if (includesAny(text, ["absent", " अनुपस्थित", "விடுப்பு", "గైరు"])) return "absent";
  return null;
}

function processMessage(session, rawMessage) {
  const message = safeText(rawMessage, 600);
  const text = message.toLowerCase();
  const language = session.language || "en";
  const common = { chips: [], expression: "calm", data: null };

  if (!message) return { ...common, reply: phrase(language, "help") };
  if (looksUnsafe(message)) {
    return { ...common, reply: phrase(language, "blocked"), expression: "concerned" };
  }

  const saysYes = /^(yes|yeah|yep|haan|हाँ|ha|ஆம்|అవును)[.! ]*$/i.test(text);
  if (session.pendingEscalation && saysYes) {
    const target = session.pendingEscalation.target;
    session.pendingEscalation = null;
    return { ...common, reply: "", triggerEscalation: { target, reason: "User requested human support in chat." }, expression: "warm" };
  }
  const saysNo = /^(no|nope|not now|later|नहीं|नको|না|இல்லை|లేదు)[.! ]*$/i.test(text);
  if (session.pendingEscalation && saysNo) {
    session.pendingEscalation = null;
    return { ...common, reply: "No problem. I will not submit a support request. I am still here if you need anything else.", expression: "warm" };
  }

  const wantsManagement = includesAny(text, ["management", "principal", "school office", "management se", "प्रबंधन"]);
  const wantsTeacher = includesAny(text, ["teacher", "class teacher", "talk to", "speak to", "not satisfied", "human", "शिक्षक", "टीचर"]);
  if (wantsManagement || wantsTeacher) {
    const target = wantsManagement ? "management" : "teacher";
    const permission = target === "teacher" ? "escalation:teacher" : "escalation:management";
    if (!hasPermission(session.role, permission)) return { ...common, reply: phrase(language, "denied"), expression: "concerned" };
    session.pendingEscalation = { target };
    return { ...common, reply: phrase(language, target === "teacher" ? "escalationAskTeacher" : "escalationAskManagement"), chips: ["Yes, submit request", "Not now"], expression: "warm" };
  }

  const asksRecent = includesAny(text, ["recent", "last", "record", "history", "हाल", "समீப", "ఇటీవలి"]);
  const asksAttendance = includesAny(text, ["attendance", "attend", "present", "absent", "उपस्थिति", "उपस्थिती", "हाजिरी", "উপস্থিতি", "હાજરી", "ਹਾਜ਼ਰੀ", "ಹಾಜರಾತಿ", "ഹാജർ", "حاضری", "வருகை", "హాజరు"]);
  const asksSchoolAnalytics = includesAny(text, ["overall", "school-wide", "whole school", "analytics", "school attendance"]);
  if (session.role === "teacher" && (text.startsWith("mark") || (asksAttendance && normaliseStatus(text)))) {
    if (!hasPermission(session.role, "attendance:class:write")) return { ...common, reply: phrase(language, "denied") };
    const status = normaliseStatus(text);
    const studentName = text.includes("rahul") ? "Rahul" : "";
    if (!status || !studentName) return { ...common, reply: phrase(language, "askMark"), chips: ["Mark Rahul absent today", "Mark Rahul present today"] };
    const result = markAttendance({ studentName, status, date: "today" });
    if (!result.ok) return { ...common, reply: phrase(language, "notFound") };
    return { ...common, reply: phrase(language, "marked", { name: result.student.name, status: result.status, date: result.date }), expression: "celebrate", data: { type: "attendance-update", status: result.status } };
  }

  if (session.role === "principal" && asksAttendance) {
    if (!hasPermission(session.role, "attendance:school:analytics")) return { ...common, reply: phrase(language, "denied") };
    return {
      ...common,
      reply: phrase(language, "analytics", { value: attendanceSummary.schoolAttendance, present: attendanceSummary.studentsPresent, total: attendanceSummary.studentsTotal, below: attendanceSummary.classesBelowThreshold, lowest: attendanceSummary.lowestClass, trend: attendanceSummary.trend }),
      expression: "confident",
      data: { type: "school-analytics", ...attendanceSummary }
    };
  }

  if (asksSchoolAnalytics) {
    return { ...common, reply: phrase(language, "denied"), expression: "concerned" };
  }

  if (asksAttendance || asksRecent) {
    const permission = session.role === "student" ? "attendance:own" : session.role === "parent" ? "attendance:child" : "attendance:class:read";
    if (!hasPermission(session.role, permission)) return { ...common, reply: phrase(language, "denied") };
    const student = getStudentForSession(session);
    if (!student) return { ...common, reply: phrase(language, "askMark") };
    if (asksRecent) return { ...common, reply: phrase(language, "recent", { name: student.name, items: recentItems(student) }), data: { type: "recent-attendance", records: student.recentAttendance }, expression: "confident" };
    return { ...common, reply: phrase(language, "checking") + " " + phrase(language, "attendance", { name: student.name, value: student.attendance }), chips: ["Show recent attendance", "Talk to Teacher"], data: { type: "attendance", value: student.attendance, student: student.name }, expression: "confident" };
  }

  if (includesAny(text, ["hello", "hi", "hey", "namaste", "नमस्ते", "வணக்கம்", "నమస్కారం"])) return { ...common, reply: phrase(language, "greeting", { name: session.profile.name }), expression: "warm" };

  return { ...common, reply: phrase(language, "help"), chips: session.role === "principal" ? ["What is the overall attendance?"] : ["What is my attendance?", "Talk to Teacher"] };
}

function completedEscalationReply(session, reference, target) {
  return phrase(session.language || "en", target === "teacher" ? "escalationDoneTeacher" : "escalationDoneManagement", { reference });
}

module.exports = { processMessage, completedEscalationReply, phrase };
