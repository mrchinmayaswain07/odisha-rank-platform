-- ==============================================================================
-- OdishaRank Production Seed Data Migration
-- Migration: 002_seed_data.sql
-- Verified sample syllabus, study materials, questions, and mock tests
-- ==============================================================================

-- 1. EXAM CATALOG (OSSC, OSSSC, OPSC)
INSERT INTO public.exams (id, slug, title, conducting_body, description, eligibility, stages, is_active)
VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'ossc-cgl',
    'OSSC Combined Graduate Level (CGL)',
    'OSSC',
    'Combined Graduate Level Examination conducted by the Odisha Staff Selection Commission for recruitment to Group B and Group C State Cadre Specialist and General posts.',
    'Bachelor degree in any discipline from a recognized University with Odia as a subject up to ME standard.',
    '[
        {"name": "Preliminary Examination", "marks": 150, "type": "Objective MCQ (150 Questions, 150 Mins)"},
        {"name": "Main Written Examination", "marks": 200, "type": "Subjective & Objective (Language & General Studies)"},
        {"name": "Computer Skill Test & Certificate Verification", "marks": 50, "type": "Qualifying"}
    ]'::jsonb,
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'osssc-cre',
    'OSSSC Combined Recruitment Examination (RI, AMIN, ARI)',
    'OSSSC',
    'Competitive recruitment conducted by the Odisha Sub-Ordinate Staff Selection Commission for Revenue Inspector (RI), Assistant Revenue Inspector (ARI), AMIN, and ICDS Supervisor.',
    'Graduation / Higher Secondary (+2) / Matriculation with Surveying qualification depending on post.',
    '[
        {"name": "Preliminary Examination", "marks": 100, "type": "MCQ (100 Questions, 1.5 Hours)"},
        {"name": "Main Examination", "marks": 180, "type": "MCQ & Skill Test (3 Hours)"},
        {"name": "Practical Computer Test", "marks": 50, "type": "Qualifying"}
    ]'::jsonb,
    true
),
(
    '33333333-3333-3333-3333-333333333333',
    'opsc-oas',
    'OPSC Odisha Civil Services (OCS / OAS)',
    'OPSC',
    'Premier state civil services examination conducted by Odisha Public Service Commission for recruitment to Odisha Administrative Service, Police Service, Finance Service, and Revenue Service.',
    'Graduate in any discipline. Candidate must be able to read, write, and speak Odia.',
    '[
        {"name": "Preliminary Examination", "marks": 400, "type": "Paper I & Paper II (General Studies, Objective)"},
        {"name": "Main Written Examination", "marks": 1750, "type": "Compulsory & Optional Papers (Descriptive)"},
        {"name": "Personality Test / Interview", "marks": 250, "type": "Viva Voce"}
    ]'::jsonb,
    true
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 2. SUBJECTS FOR OSSC CGL
INSERT INTO public.subjects (id, exam_id, name, code, description, order_index)
VALUES
(
    'a1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'General Studies & Odisha Special',
    'GS-01',
    'Indian History, Odisha History, Geography, Indian Polity, Economy, and Current Affairs.',
    1
),
(
    'a2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Arithmetic & Quantitative Aptitude',
    'QA-02',
    'Percentages, Ratio, Time & Work, Speed & Distance, SI/CI, Mensuration, and Data Interpretation.',
    2
),
(
    'a3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Logical Reasoning & Mental Ability',
    'LR-03',
    'Verbal and Non-verbal reasoning, Series, Coding-Decoding, Directions, Syllogisms.',
    3
),
(
    'a4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'Computer & Internet Awareness',
    'CA-04',
    'Computer Fundamentals, MS Windows, MS Office (Word, Excel, PowerPoint), Internet & Security.',
    4
)
ON CONFLICT (id) DO NOTHING;

-- 3. CHAPTERS FOR GENERAL STUDIES
INSERT INTO public.chapters (id, subject_id, title, description, order_index, is_official)
VALUES
(
    'b1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'History & Heritage of Odisha',
    'Kalinga War, Ganga Dynasty, Gajapati Empire, Paika Rebellion, and Freedom Movement in Odisha.',
    1,
    true
),
(
    'b2222222-2222-2222-2222-222222222222',
    'a1111111-1111-1111-1111-111111111111',
    'Geography & Natural Resources of Odisha',
    'Physiography, Rivers (Mahanadi, Brahmani, Baitarani), Climate, Forests, Minerals, and Biosphere Reserves.',
    2,
    true
),
(
    'b3333333-3333-3333-3333-333333333333',
    'a1111111-1111-1111-1111-111111111111',
    'Indian Constitution & Governance',
    'Preamble, Fundamental Rights, Directive Principles, Parliament, Judiciary, and Panchayati Raj in Odisha.',
    3,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 4. TOPICS
INSERT INTO public.topics (id, chapter_id, title, description, estimated_minutes, order_index, is_official)
VALUES
(
    'c1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'The Kalinga War & Ashoka''s Rock Edicts in Odisha',
    'Historical significance of 261 BCE Kalinga War, Dhauli and Jaugada major rock edicts.',
    45,
    1,
    true
),
(
    'c2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'The Paika Rebellion (1817) & Bakshi Jagabandhu',
    'Causes, leadership of Bakshi Jagabandhu Bidyadhara, armed resistance against British rule, historical recognition.',
    50,
    2,
    true
),
(
    'c3333333-3333-3333-3333-333333333333',
    'b2222222-2222-2222-2222-222222222222',
    'River Systems of Odisha: Mahanadi, Brahmani & Baitarani',
    'Origins, major tributaries, dams (Hirakud Dam, Rengali Dam), and river delta ecology.',
    60,
    1,
    true
),
(
    'c4444444-4444-4444-4444-444444444444',
    'b2222222-2222-2222-2222-222222222222',
    'National Parks & Wildlife Sanctuaries in Odisha',
    'Similipal Tiger Reserve, Bhitarkanika Mangroves & Saltwater Crocodiles, Chilika Lake Ramsar site.',
    55,
    2,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. STUDY MATERIALS
INSERT INTO public.study_materials (id, topic_id, title, material_type, content, url, is_official)
VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Comprehensive Summary: The Kalinga War (261 BCE)',
    'summary',
    '### Overview of Kalinga War\n- **Date:** 261 BCE (8th regnal year of Emperor Ashoka).\n- **Location:** Near the Daya River and Dhauli hills, south of modern Bhubaneswar.\n- **Significance:** Ashoka was struck with deep remorse after seeing the colossal bloodshed (100,000 slain, 150,000 captive).\n- **Transformation:** Led directly to Ashoka embracing Buddhism (Dhamma-vijaya instead of Dig-vijaya).\n- **Key Inscriptions in Odisha:**\n  1. **Dhauli (Khordha district):** Major Rock Edict detailing peace, justice, and the welfare of subjects.\n  2. **Jaugada (Ganjam district):** Separate Kalinga edicts focusing on impartial administration of justice.',
    NULL,
    true
),
(
    'd2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    'Key Study Notes: Paika Rebellion of 1817',
    'note',
    '### Important Facts for OSSC/OSSSC/OPSC\n- **Who were the Paikas?** The traditional landed peasant militia of the Gajapati Kings of Khurda.\n- **Immediate Triggers:**\n  - Deprivation of rent-free lands (*Nish-kar Jagir*).\n  - Monopolization of salt manufacturing by the British East India Company.\n  - High revenue demands causing heavy peasant eviction.\n- **Supreme Leader:** Bakshi Jagabandhu Bidyadhara Mohapatra Bhramarabar Rai.\n- **Other Prominent Leaders:** Dinabandhu Samantasinghar, Mir Haidar Ali, Krushna Chandra Bidyadhar.\n- **Key Event:** Attack on Banapur and Khurda in March 1817.\n- **Historical Legacy:** Recognized as one of India''s earliest organized mass armed struggles against British colonial rule.',
    NULL,
    true
),
(
    'd3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'Odisha River Systems Quick Reference Table',
    'text',
    '### Odisha Major River Systems\n\n| River | Origin | Major Tributaries | Key Dam / Reservoir |\n|---|---|---|---|\n| **Mahanadi** | Sihawa Mountain (Dhamtari, Chhattisgarh) | Seonath, Hasdeo, Jonk, Mand, Ib, Ong, Tel | **Hirakud Dam** (Sambalpur, one of the world''s longest earthen dams) |\n| **Brahmani** | Confluence of Sankh and South Koel near Vedvyas (Rourkela) | Tikira, Samakoi | **Rengali Dam** (Angul) |\n| **Baitarani** | Gonasika in Guptaganga (Keonjhar) | Salandi, Deo | Anandapur Barrage |\n| **Subarnarekha** | Nagri village near Ranchi (Jharkhand) | Kanchi, Karkari, Kharkai | Chandil Dam |\n| **Rushikulya** | Daringbadi hills (Kandhamal) | Baghua, Dhanei | Ganjam coastal drainage |',
    NULL,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 6. QUESTION BANK (Verified sample questions labeled demo/sample)
INSERT INTO public.questions (id, exam_id, subject_id, topic_id, question_text, options, correct_option_index, explanation, difficulty, is_sample)
VALUES
(
    'e1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'Near which river bank was the historic Kalinga War fought in 261 BCE?',
    '["Mahanadi River", "Daya River", "Brahmani River", "Rushikulya River"]'::jsonb,
    1,
    'The Kalinga War (261 BCE) was fought on the banks of the Daya River near the Dhauli hills, south of present-day Bhubaneswar.',
    'easy',
    true
),
(
    'e2222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    'Who was the supreme military commander and leader of the Paika Rebellion of 1817 in Odisha?',
    '["Surendra Sai", "Bakshi Jagabandhu", "Chakhi Khuntia", "Madho Singh"]'::jsonb,
    1,
    'Bakshi Jagabandhu Bidyadhara was the military chief (Bakshi) of the King of Khurda who led the Paika Rebellion of 1817.',
    'easy',
    true
),
(
    'e3333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c3333333-3333-3333-3333-333333333333',
    'Hirakud Dam, built across the Mahanadi river, is situated in which district of Odisha?',
    '["Jharsuguda", "Cuttack", "Sambalpur", "Bargarh"]'::jsonb,
    2,
    'Hirakud Dam was constructed across the Mahanadi River in Sambalpur district and was inaugurated by Prime Minister Jawaharlal Nehru in 1957.',
    'easy',
    true
),
(
    'e4444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c4444444-4444-4444-4444-444444444444',
    'Which national park in Odisha is internationally famous as a nesting ground for Olive Ridley sea turtles and saltwater crocodiles?',
    '["Similipal National Park", "Bhitarkanika National Park", "Karlapat Sanctuary", "Ushakothi Sanctuary"]'::jsonb,
    1,
    'Bhitarkanika National Park in Kendrapara district is famous for its dense mangrove ecosystem, saltwater crocodiles, and the nearby Gahirmatha beach which is the world''s largest rookery for Olive Ridley turtles.',
    'medium',
    true
),
(
    'e5555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'a4444444-4444-4444-4444-444444444444',
    NULL,
    'In computer networks, what does DHCP stand for?',
    '["Data Host Control Protocol", "Dynamic Host Configuration Protocol", "Digital Hypertext Transfer Protocol", "Distributed Host Communication Provider"]'::jsonb,
    1,
    'DHCP stands for Dynamic Host Configuration Protocol, which automatically assigns IP addresses and network parameters to client devices.',
    'medium',
    true
),
(
    'e6666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'a2222222-2222-2222-2222-222222222222',
    NULL,
    'If 15 men can complete a project in 12 days working 8 hours a day, how many days will 20 men take to complete the same work working 6 hours a day?',
    '["10 days", "12 days", "15 days", "18 days"]'::jsonb,
    1,
    'Formula: M1 * D1 * H1 = M2 * D2 * H2. (15 * 12 * 8) = (20 * D2 * 6) => 1440 = 120 * D2 => D2 = 12 days.',
    'medium',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 7. MOCK TESTS
INSERT INTO public.mock_tests (id, exam_id, title, description, duration_minutes, total_marks, negative_marking, pass_percentage, is_published)
VALUES
(
    'f1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'OSSC CGL General Studies Full Mock Test 1',
    'Full-length preliminary practice test modeled after the official OSSC CGL pattern. Tests Odisha History, Geography, Polity, Arithmetic, and Computer Fundamentals.',
    30,
    6.0,
    0.25,
    40.0,
    true
),
(
    'f2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'OSSSC Combined Recruitment (RI/AMIN) Practice Paper',
    'Targeted speed & accuracy test covering general awareness, Odisha current knowledge, and reasoning skills.',
    25,
    5.0,
    0.25,
    40.0,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 8. LINK QUESTIONS TO MOCK TEST
INSERT INTO public.mock_test_questions (mock_test_id, question_id, marks, order_index)
VALUES
('f1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 1.0, 1),
('f1111111-1111-1111-1111-111111111111', 'e2222222-2222-2222-2222-222222222222', 1.0, 2),
('f1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 1.0, 3),
('f1111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 1.0, 4),
('f1111111-1111-1111-1111-111111111111', 'e5555555-5555-5555-5555-555555555555', 1.0, 5),
('f1111111-1111-1111-1111-111111111111', 'e6666666-6666-6666-6666-666666666666', 1.0, 6)
ON CONFLICT (mock_test_id, question_id) DO NOTHING;
