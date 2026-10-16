import { Exam, Subject, Chapter, Topic, StudyMaterial, Question, MockTest } from "./types";

export const SEED_EXAMS: Exam[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    slug: "ossc-cgl",
    title: "OSSC Combined Graduate Level (CGL)",
    conducting_body: "OSSC",
    description: "Combined Graduate Level Examination conducted by the Odisha Staff Selection Commission for recruitment to Group B and Group C State Cadre Specialist and General posts.",
    eligibility: "Bachelor degree in any discipline from a recognized University with Odia as a subject up to ME standard.",
    stages: [
      { name: "Preliminary Examination", marks: 150, type: "Objective MCQ (150 Questions, 150 Mins)" },
      { name: "Main Written Examination", marks: 200, type: "Subjective & Objective (Language & General Studies)" },
      { name: "Computer Skill Test & Certificate Verification", marks: 50, type: "Qualifying" }
    ],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    slug: "osssc-cre",
    title: "OSSSC Combined Recruitment Examination (RI, AMIN, ARI)",
    conducting_body: "OSSSC",
    description: "Competitive recruitment conducted by the Odisha Sub-Ordinate Staff Selection Commission for Revenue Inspector (RI), Assistant Revenue Inspector (ARI), AMIN, and ICDS Supervisor.",
    eligibility: "Graduation / Higher Secondary (+2) / Matriculation with Surveying qualification depending on post.",
    stages: [
      { name: "Preliminary Examination", marks: 100, type: "MCQ (100 Questions, 1.5 Hours)" },
      { name: "Main Examination", marks: 180, type: "MCQ & Skill Test (3 Hours)" },
      { name: "Practical Computer Test", marks: 50, type: "Qualifying" }
    ],
    is_active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    slug: "opsc-oas",
    title: "OPSC Odisha Civil Services (OCS / OAS)",
    conducting_body: "OPSC",
    description: "Premier state civil services examination conducted by Odisha Public Service Commission for recruitment to Odisha Administrative Service, Police Service, Finance Service, and Revenue Service.",
    eligibility: "Graduate in any discipline. Candidate must be able to read, write, and speak Odia.",
    stages: [
      { name: "Preliminary Examination", marks: 400, type: "Paper I & Paper II (General Studies, Objective)" },
      { name: "Main Written Examination", marks: 1750, type: "Compulsory & Optional Papers (Descriptive)" },
      { name: "Personality Test / Interview", marks: 250, type: "Viva Voce" }
    ],
    is_active: true,
    created_at: new Date().toISOString()
  }
];

export const SEED_SUBJECTS: Subject[] = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    exam_id: "11111111-1111-1111-1111-111111111111",
    name: "General Studies & Odisha Special",
    code: "GS-01",
    description: "Indian History, Odisha History, Geography, Indian Polity, Economy, and Current Affairs.",
    order_index: 1,
    created_at: new Date().toISOString(),
    chapters_count: 3,
    topics_count: 4,
    completed_topics_count: 0
  },
  {
    id: "a2222222-2222-2222-2222-222222222222",
    exam_id: "11111111-1111-1111-1111-111111111111",
    name: "Arithmetic & Quantitative Aptitude",
    code: "QA-02",
    description: "Percentages, Ratio, Time & Work, Speed & Distance, SI/CI, Mensuration, and Data Interpretation.",
    order_index: 2,
    created_at: new Date().toISOString(),
    chapters_count: 2,
    topics_count: 3,
    completed_topics_count: 0
  },
  {
    id: "a3333333-3333-3333-3333-333333333333",
    exam_id: "11111111-1111-1111-1111-111111111111",
    name: "Logical Reasoning & Mental Ability",
    code: "LR-03",
    description: "Verbal and Non-verbal reasoning, Series, Coding-Decoding, Directions, Syllogisms.",
    order_index: 3,
    created_at: new Date().toISOString(),
    chapters_count: 2,
    topics_count: 2,
    completed_topics_count: 0
  },
  {
    id: "a4444444-4444-4444-4444-444444444444",
    exam_id: "11111111-1111-1111-1111-111111111111",
    name: "Computer & Internet Awareness",
    code: "CA-04",
    description: "Computer Fundamentals, MS Windows, MS Office (Word, Excel, PowerPoint), Internet & Security.",
    order_index: 4,
    created_at: new Date().toISOString(),
    chapters_count: 1,
    topics_count: 2,
    completed_topics_count: 0
  },
  {
    id: "a5555555-5555-5555-5555-555555555555",
    exam_id: "22222222-2222-2222-2222-222222222222",
    name: "General Awareness & Odisha Heritage",
    code: "GA-01",
    description: "Odisha History, Geography, Culture, Government Schemes, and Current Affairs.",
    order_index: 1,
    created_at: new Date().toISOString(),
    chapters_count: 2,
    topics_count: 3,
    completed_topics_count: 0
  },
  {
    id: "a6666666-6666-6666-6666-666666666666",
    exam_id: "22222222-2222-2222-2222-222222222222",
    name: "Arithmetic & Land Mensuration",
    code: "AM-02",
    description: "Basic arithmetic, Percentage, Average, Land measurement units, Perimeter and Area.",
    order_index: 2,
    created_at: new Date().toISOString(),
    chapters_count: 2,
    topics_count: 3,
    completed_topics_count: 0
  },
  {
    id: "a7777777-7777-7777-7777-777777777777",
    exam_id: "22222222-2222-2222-2222-222222222222",
    name: "Basic Computer Skills & Surveying",
    code: "CS-03",
    description: "MS Word, Excel, PowerPoint, Internet concepts, and basic surveying principles.",
    order_index: 3,
    created_at: new Date().toISOString(),
    chapters_count: 1,
    topics_count: 2,
    completed_topics_count: 0
  },
  {
    id: "a8888888-8888-8888-8888-888888888888",
    exam_id: "33333333-3333-3333-3333-333333333333",
    name: "General Studies Paper I (OAS)",
    code: "GS-OAS-01",
    description: "Indian & Odisha History, Physical and Social Geography, Indian Polity and Governance, Economic Development.",
    order_index: 1,
    created_at: new Date().toISOString(),
    chapters_count: 3,
    topics_count: 4,
    completed_topics_count: 0
  }
];

export const SEED_CHAPTERS: Chapter[] = [
  {
    id: "b1111111-1111-1111-1111-111111111111",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    title: "History & Heritage of Odisha",
    description: "Kalinga War, Ganga Dynasty, Gajapati Empire, Paika Rebellion, and Freedom Movement in Odisha.",
    order_index: 1,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    title: "Geography & Natural Resources of Odisha",
    description: "Physiography, Rivers (Mahanadi, Brahmani, Baitarani), Climate, Forests, Minerals, and Biosphere Reserves.",
    order_index: 2,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "b3333333-3333-3333-3333-333333333333",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    title: "Indian Constitution & Governance",
    description: "Preamble, Fundamental Rights, Directive Principles, Parliament, Judiciary, and Panchayati Raj in Odisha.",
    order_index: 3,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  }
];

export const SEED_TOPICS: Topic[] = [
  {
    id: "c1111111-1111-1111-1111-111111111111",
    chapter_id: "b1111111-1111-1111-1111-111111111111",
    title: "The Kalinga War & Ashoka's Rock Edicts in Odisha",
    description: "Historical significance of 261 BCE Kalinga War, Dhauli and Jaugada major rock edicts.",
    estimated_minutes: 45,
    order_index: 1,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "c2222222-2222-2222-2222-222222222222",
    chapter_id: "b1111111-1111-1111-1111-111111111111",
    title: "The Paika Rebellion (1817) & Bakshi Jagabandhu",
    description: "Causes, leadership of Bakshi Jagabandhu Bidyadhara, armed resistance against British rule, historical recognition.",
    estimated_minutes: 50,
    order_index: 2,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    chapter_id: "b2222222-2222-2222-2222-222222222222",
    title: "River Systems of Odisha: Mahanadi, Brahmani & Baitarani",
    description: "Origins, major tributaries, dams (Hirakud Dam, Rengali Dam), and river delta ecology.",
    estimated_minutes: 60,
    order_index: 1,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "c4444444-4444-4444-4444-444444444444",
    chapter_id: "b2222222-2222-2222-2222-222222222222",
    title: "National Parks & Wildlife Sanctuaries in Odisha",
    description: "Similipal Tiger Reserve, Bhitarkanika Mangroves & Saltwater Crocodiles, Chilika Lake Ramsar site.",
    estimated_minutes: 55,
    order_index: 2,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  }
];

export const SEED_MATERIALS: StudyMaterial[] = [
  {
    id: "d1111111-1111-1111-1111-111111111111",
    topic_id: "c1111111-1111-1111-1111-111111111111",
    title: "Comprehensive Summary: The Kalinga War (261 BCE)",
    material_type: "summary",
    content: "### Overview of Kalinga War\n- **Date:** 261 BCE (8th regnal year of Emperor Ashoka).\n- **Location:** Near the Daya River and Dhauli hills, south of modern Bhubaneswar.\n- **Significance:** Ashoka was struck with deep remorse after seeing the colossal bloodshed (100,000 slain, 150,000 captive).\n- **Transformation:** Led directly to Ashoka embracing Buddhism (Dhamma-vijaya instead of Dig-vijaya).\n- **Key Inscriptions in Odisha:**\n  1. **Dhauli (Khordha district):** Major Rock Edict detailing peace, justice, and the welfare of subjects.\n  2. **Jaugada (Ganjam district):** Separate Kalinga edicts focusing on impartial administration of justice.",
    url: null,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "d2222222-2222-2222-2222-222222222222",
    topic_id: "c2222222-2222-2222-2222-222222222222",
    title: "Key Study Notes: Paika Rebellion of 1817",
    material_type: "note",
    content: "### Important Facts for OSSC/OSSSC/OPSC\n- **Who were the Paikas?** The traditional landed peasant militia of the Gajapati Kings of Khurda.\n- **Immediate Triggers:**\n  - Deprivation of rent-free lands (*Nish-kar Jagir*).\n  - Monopolization of salt manufacturing by the British East India Company.\n  - High revenue demands causing heavy peasant eviction.\n- **Supreme Leader:** Bakshi Jagabandhu Bidyadhara Mohapatra Bhramarabar Rai.\n- **Other Prominent Leaders:** Dinabandhu Samantasinghar, Mir Haidar Ali, Krushna Chandra Bidyadhar.\n- **Key Event:** Attack on Banapur and Khurda in March 1817.\n- **Historical Legacy:** Recognized as one of India's earliest organized mass armed struggles against British colonial rule.",
    url: null,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "d3333333-3333-3333-3333-333333333333",
    topic_id: "c3333333-3333-3333-3333-333333333333",
    title: "Odisha River Systems Quick Reference Table",
    material_type: "text",
    content: "### Odisha Major River Systems\n\n- **Mahanadi:** Originates in Sihawa Mountain (Dhamtari, Chhattisgarh). Major tributaries include Tel, Ib, Ong, Seonath. Features **Hirakud Dam** (Sambalpur), one of the world's longest earthen dams.\n- **Brahmani:** Formed by confluence of Sankh and South Koel near Vedvyas (Rourkela). Features **Rengali Dam** (Angul).\n- **Baitarani:** Originates from Gonasika in Guptaganga (Keonjhar). Sacred river of Odisha.\n- **Subarnarekha:** Originates from Nagri near Ranchi. Flowing through Mayurbhanj and Balasore into the Bay of Bengal.\n- **Rushikulya:** Originates from Daringbadi hills (Kandhamal). Mouth of Rushikulya is famous for Olive Ridley turtle mass nesting.",
    url: null,
    is_official: true,
    created_by: null,
    created_at: new Date().toISOString()
  }
];

export const SEED_QUESTIONS: Question[] = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    topic_id: "c1111111-1111-1111-1111-111111111111",
    question_text: "Near which river bank was the historic Kalinga War fought in 261 BCE?",
    options: ["Mahanadi River", "Daya River", "Brahmani River", "Rushikulya River"],
    correct_option_index: 1,
    explanation: "The Kalinga War (261 BCE) was fought on the banks of the Daya River near the Dhauli hills, south of present-day Bhubaneswar.",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    topic_id: "c2222222-2222-2222-2222-222222222222",
    question_text: "Who was the supreme military commander and leader of the Paika Rebellion of 1817 in Odisha?",
    options: ["Surendra Sai", "Bakshi Jagabandhu", "Chakhi Khuntia", "Madho Singh"],
    correct_option_index: 1,
    explanation: "Bakshi Jagabandhu Bidyadhara was the military chief (Bakshi) of the King of Khurda who led the Paika Rebellion of 1817.",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    topic_id: "c3333333-3333-3333-3333-333333333333",
    question_text: "Hirakud Dam, built across the Mahanadi river, is situated in which district of Odisha?",
    options: ["Jharsuguda", "Cuttack", "Sambalpur", "Bargarh"],
    correct_option_index: 2,
    explanation: "Hirakud Dam was constructed across the Mahanadi River in Sambalpur district and was inaugurated by Prime Minister Jawaharlal Nehru in 1957.",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a1111111-1111-1111-1111-111111111111",
    topic_id: "c4444444-4444-4444-4444-444444444444",
    question_text: "Which national park in Odisha is internationally famous as a nesting ground for Olive Ridley sea turtles and saltwater crocodiles?",
    options: ["Similipal National Park", "Bhitarkanika National Park", "Karlapat Sanctuary", "Ushakothi Sanctuary"],
    correct_option_index: 1,
    explanation: "Bhitarkanika National Park in Kendrapara district is famous for its dense mangrove ecosystem, saltwater crocodiles, and the nearby Gahirmatha beach.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e5555555-5555-5555-5555-555555555555",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a4444444-4444-4444-4444-444444444444",
    topic_id: null,
    question_text: "In computer networks, what does DHCP stand for?",
    options: ["Data Host Control Protocol", "Dynamic Host Configuration Protocol", "Digital Hypertext Transfer Protocol", "Distributed Host Communication Provider"],
    correct_option_index: 1,
    explanation: "DHCP stands for Dynamic Host Configuration Protocol, which automatically assigns IP addresses and network parameters to client devices.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e6666666-6666-6666-6666-666666666666",
    exam_id: "11111111-1111-1111-1111-111111111111",
    subject_id: "a2222222-2222-2222-2222-222222222222",
    topic_id: null,
    question_text: "If 15 men can complete a project in 12 days working 8 hours a day, how many days will 20 men take to complete the same work working 6 hours a day?",
    options: ["10 days", "12 days", "15 days", "18 days"],
    correct_option_index: 1,
    explanation: "Formula: M1 * D1 * H1 = M2 * D2 * H2. (15 * 12 * 8) = (20 * D2 * 6) => 1440 = 120 * D2 => D2 = 12 days.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e7777777-7777-7777-7777-777777777777",
    exam_id: "22222222-2222-2222-2222-222222222222",
    subject_id: "a5555555-5555-5555-5555-555555555555",
    topic_id: null,
    question_text: "Under which administrative department does the post of Revenue Inspector (RI) function in Odisha?",
    options: [
      "Home Department",
      "Revenue and Disaster Management Department",
      "Panchayati Raj and Drinking Water Department",
      "Finance Department"
    ],
    correct_option_index: 1,
    explanation: "The Revenue Inspector (RI) works under the Revenue and Disaster Management Department of the Government of Odisha at the Tahasil and Revenue Circle level.",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e8888888-8888-8888-8888-888888888888",
    exam_id: "22222222-2222-2222-2222-222222222222",
    subject_id: "a6666666-6666-6666-6666-666666666666",
    topic_id: null,
    question_text: "In Odisha land revenue and surveying records, how many Decimals equal 1 Acre of land?",
    options: ["50 Decimals", "100 Decimals", "150 Decimals", "200 Decimals"],
    correct_option_index: 1,
    explanation: "In Odisha standard land records (RoR), 1 Acre is universally divided into 100 Decimals (also known as Cents/Gunthas based on regional nomenclature).",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "e9999999-9999-9999-9999-999999999999",
    exam_id: "22222222-2222-2222-2222-222222222222",
    subject_id: "a7777777-7777-7777-7777-777777777777",
    topic_id: null,
    question_text: "In MS Excel, what is the default keyboard shortcut used to auto-calculate the sum of adjacent cells?",
    options: ["Ctrl + S", "Alt + =", "Ctrl + Shift + S", "Alt + F4"],
    correct_option_index: 1,
    explanation: "The shortcut key 'Alt + =' in Microsoft Excel automatically inserts the AutoSum formula for adjacent rows or columns.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "ea111111-1111-1111-1111-111111111111",
    exam_id: "22222222-2222-2222-2222-222222222222",
    subject_id: "a5555555-5555-5555-5555-555555555555",
    topic_id: null,
    question_text: "Who composed the state anthem of Odisha, 'Bande Utkala Janani'?",
    options: [
      "Radhanath Ray",
      "Kantakabi Lakshmikanta Mohapatra",
      "Fakir Mohan Senapati",
      "Gopabandhu Das"
    ],
    correct_option_index: 1,
    explanation: "'Bande Utkala Janani' was composed in 1912 by Kantakabi Lakshmikanta Mohapatra and was officially declared as the state song of Odisha in 2020.",
    difficulty: "easy",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "ea222222-2222-2222-2222-222222222222",
    exam_id: "33333333-3333-3333-3333-333333333333",
    subject_id: "a8888888-8888-8888-8888-888888888888",
    topic_id: null,
    question_text: "The Konark Sun Temple was constructed during the reign of which monarch of the Eastern Ganga Dynasty in the 13th century?",
    options: [
      "Anantavarman Chodaganga Deva",
      "Langula Narasimhadeva I",
      "Bhanudeva II",
      "Kapilendradeva"
    ],
    correct_option_index: 1,
    explanation: "The magnificent 13th-century Konark Sun Temple (a UNESCO World Heritage site) was built by King Narasimhadeva I of the Eastern Ganga Dynasty around 1250 CE.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  },
  {
    id: "ea333333-3333-3333-3333-333333333333",
    exam_id: "33333333-3333-3333-3333-333333333333",
    subject_id: "a8888888-8888-8888-8888-888888888888",
    topic_id: null,
    question_text: "In which year was Chilika Lake in Odisha designated as the first Indian wetland of international importance under the Ramsar Convention?",
    options: ["1972", "1981", "1986", "1992"],
    correct_option_index: 1,
    explanation: "Chilika Lake was designated as the very first Ramsar Site in India in 1981 due to its extraordinary biodiversity and vital wintering grounds for migratory waterfowl.",
    difficulty: "medium",
    is_sample: true,
    created_by: null,
    created_at: new Date().toISOString()
  }
];

export const SEED_MOCK_TESTS: MockTest[] = [
  {
    id: "f1111111-1111-1111-1111-111111111111",
    exam_id: "11111111-1111-1111-1111-111111111111",
    title: "OSSC CGL General Studies Full Mock Test 1",
    description: "Full-length preliminary practice test modeled after the official OSSC CGL pattern. Tests Odisha History, Geography, Polity, Arithmetic, and Computer Fundamentals.",
    duration_minutes: 30,
    total_marks: 6.0,
    negative_marking: 0.25,
    pass_percentage: 40.0,
    is_published: true,
    created_at: new Date().toISOString(),
    questions_count: 6
  },
  {
    id: "f2222222-2222-2222-2222-222222222222",
    exam_id: "22222222-2222-2222-2222-222222222222",
    title: "OSSSC Combined Recruitment (RI/AMIN) Practice Paper",
    description: "Targeted speed & accuracy test covering general awareness, Odisha current knowledge, and reasoning skills.",
    duration_minutes: 25,
    total_marks: 5.0,
    negative_marking: 0.25,
    pass_percentage: 40.0,
    is_published: true,
    created_at: new Date().toISOString(),
    questions_count: 5
  }
];
