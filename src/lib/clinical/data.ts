/**
 * Clinical reference lists.
 *
 * These are editable content, not code: the lists below are the ones the
 * practice actually uses, and adding to them requires nothing but an entry
 * here. Advice lines carry a stable `id` — never reorder by index, because
 * saved prescriptions reference these ids.
 */

export type ComplaintGroup = { group: string; items: string[] };

export const CHIEF_COMPLAINT_GROUPS: ComplaintGroup[] = [
  {
    group: "General / Abdominal",
    items: [
      "Abdominal pain",
      "Nausea & vomiting",
      "Jaundice",
      "Fever with chills",
      "Abdominal bloating",
      "Right upper quadrant pain",
      "Right lower abdominal pain",
      "Groin swelling / lump",
      "Painful swelling / abscess",
      "Loss of appetite",
      "Weight loss",
    ],
  },
  {
    group: "Colorectal / Anorectal",
    items: [
      "Blood in stool",
      "Rectal bleeding",
      "Pain during defecation",
      "Anal itching / burning",
      "Constipation",
      "Feeling of incomplete evacuation",
      "Prolapse / tissue coming out of anus",
      "Mucus discharge from anus",
      "Change in bowel habits",
      "Perianal swelling / discharge",
    ],
  },
  {
    group: "Breast",
    items: [
      "Breast lump",
      "Breast pain / tenderness",
      "Nipple discharge",
      "Skin changes on breast",
      "Breast swelling",
      "Axillary (armpit) lump",
    ],
  },
  {
    group: "General medical",
    items: [
      "Fever",
      "Cough",
      "Chest pain",
      "Shortness of breath",
      "Headache",
      "Dysuria / urinary symptoms",
      "Joint or limb pain",
      "Vertigo",
      "Palpitation",
      "Diarrhoea",
      "Fatigue / weakness",
      "Swelling of legs",
    ],
  },
];

export const ALL_COMPLAINTS: string[] = CHIEF_COMPLAINT_GROUPS.flatMap((g) => g.items);

export type InvestigationGroup = { group: string; items: string[] };

/** Bangladesh Medical College Hospital requisition. Always printed in English. */
export const INVESTIGATION_GROUPS: InvestigationGroup[] = [
  {
    group: "Haematology",
    items: [
      "CBC (Including ESR)",
      "TC, DC, Hb, ESR",
      "Blood Film",
      "MP",
      "HCT, MCV, MCHC, MCH",
      "Reticulocyte count",
      "TCE",
      "Platelet Count",
      "BT, CT",
      "Prothrombin Time",
      "APTT",
      "D-Dimer",
      "FDP",
    ],
  },
  {
    group: "Biochemistry",
    items: [
      "Glucose: Fasting",
      "Glucose: Random / Before Lunch / Dinner",
      "Glucose: 2 hrs ABF / Lunch / Dinner",
      "Glucose: 2 hrs after 75 gm glucose",
      "GTT",
      "HbA1c",
      "Lipid profile: Cholesterol",
      "Lipid profile: HDL",
      "Lipid profile: LDL",
      "Lipid profile: Triglyceride",
      "Urea / BUN",
      "Creatinine",
      "Creatinine Clearance Rate (CCR)",
      "Bilirubin: Total / Direct / Indirect",
      "AST (SGOT)",
      "ALT (SGPT)",
      "Alkaline Phosphatase",
      "CK",
      "CK-MB",
      "LDH",
      "Amylase",
      "Lipase",
      "Prostatic Acid Phosphatase",
      "S. Total Protein",
      "S. Albumin",
      "A/G Ratio",
      "Uric Acid",
      "Arterial Blood Gas",
      "ACR",
      "S. Electrolytes: Na+",
      "S. Electrolytes: K+",
      "S. Electrolytes: Cl-",
      "S. Electrolytes: CO2",
      "S. Calcium",
      "Troponin I",
      "γ-GT",
      "Ammonia",
      "S. Iron",
      "TIBC",
      "S. Ferritin",
      "Magnesium",
      "Inorganic phosphate",
      "Vitamin D3",
      "S. Pro BNP",
    ],
  },
  { group: "Stool", items: ["R/E", "Reducing substance", "Occult Blood Test", "Fecal for estimation"] },
  {
    group: "Urine",
    items: [
      "R/E, M/E",
      "Urobilinogen",
      "Total Protein in 24 hours",
      "Ketones",
      "Phase Contrast Microscopy",
    ],
  },
  { group: "Skin / Nail", items: ["M/E", "C/S for fungi"] },
  { group: "Semen analysis", items: ["Semen analysis"] },
  {
    group: "Fluid",
    items: [
      "Fluid: CSF",
      "Fluid: Pleural fluid",
      "Fluid: Peritoneal fluid",
      "Fluid: Joint fluid",
      "Fluid exam: M/E",
      "Fluid exam: Gram Staining",
      "Fluid exam: AFB Staining",
      "Fluid exam: Sugar",
      "Fluid exam: Protein",
      "Fluid exam: ADA",
      "Fluid exam: LDH",
      "Fluid exam: Polarizing Microscopy",
    ],
  },
  {
    group: "Microbiology",
    items: [
      "Throat swab C/S",
      "Throat swab for KLB",
      "Ear, Nose, Eye swab C/S",
      "ETT Tube C/S",
      "Wound Swab C/S",
      "Drain Tube C/S",
      "Nipple Discharge C/S",
      "Umbilical Swab C/S",
      "Tracheal aspiration C/S",
      "Pus C/S",
      "Urine C/S",
      "Blood C/S",
      "HVS C/S",
      "Prostatic smear: Gram staining",
      "Prostatic smear: C/S",
      "Sputum: Gram staining",
      "Sputum: AFB Staining",
      "Sputum: C/S",
    ],
  },
  {
    group: "Serology",
    items: [
      "Pregnancy test",
      "ASO titre",
      "VDRL",
      "Widal",
      "RA test",
      "Hb s Ag (ICT Method)",
      "Dengue-IgG",
      "Dengue-IgM",
      "C-reactive protein",
      "TPHA",
      "Rose Waaler",
      "ICT (Malaria)",
      "Dengue NS1",
      "Febrile Antigen",
    ],
  },
  {
    group: "Immunology",
    items: [
      "T3",
      "T4",
      "FT3",
      "FT4",
      "TSH",
      "Anti TPO Ab",
      "Anti TG Ab",
      "Anti Thyroid Ab",
      "β-HCG",
      "Testosterone",
      "Progesterone",
      "Prolactin",
      "LH",
      "FSH",
      "IgE",
      "HIV (1+2)",
      "HAV-IgM",
      "HEV-IgM",
      "Anti HCV",
      "HBs Ag (ELISA)",
      "Anti-HBs",
      "HBe-Ag",
      "ANA/ANF",
      "Ferritin (immuno)",
      "H. pylori-IgG",
      "PSA",
      "AFP",
      "CA-125",
      "CA-19-9",
      "CA-15-3",
      "CEA",
      "Torch Panels",
      "Anti CCP",
    ],
  },
  { group: "Blood typing", items: ["Blood grouping & Rh factor", "Cross matching"] },
  {
    group: "Histopathology & Cytology",
    items: [
      "Histopathology — specimen 1",
      "Histopathology — specimen 2",
      "Histopathology — specimen 3",
      "FNAC",
      "PAP Smear",
      "Malignant cell",
    ],
  },
  {
    group: "Imaging",
    items: [
      "CXR — PA view",
      "USG whole abdomen",
      "USG KUB",
      "USG breast",
      "ECG",
      "ECHO",
      "CT scan brain",
      "CT scan chest",
      "CT scan abdomen",
      "MRI brain",
      "MRI pelvis",
      "Colonoscopy",
      "Upper GI endoscopy",
      "Proctoscopy",
    ],
  },
];

export const ALL_INVESTIGATIONS: string[] = INVESTIGATION_GROUPS.flatMap((g) => g.items);

export type AdviceItem = { id: string; en: string; bn: string };

/**
 * `id` is permanent. Change the wording freely; never change or reuse an id,
 * because prescriptions already issued point at it.
 */
export const ADVICE_LIBRARY: AdviceItem[] = [
  { id: "rest-fluids", en: "Adequate rest and fluids", bn: "পর্যাপ্ত বিশ্রাম ও পানি পান" },
  { id: "no-self-med", en: "Avoid self-medication", bn: "নিজে থেকে ওষুধ এড়িয়ে চলুন" },
  {
    id: "complete-antibiotic",
    en: "Complete the full antibiotic course",
    bn: "অ্যান্টিবায়োটিকের পুরো কোর্স শেষ করুন",
  },
  {
    id: "light-diet",
    en: "Light diet; avoid spicy and oily food",
    bn: "হালকা খাবার; ঝাল ও তৈলাক্ত খাবার এড়িয়ে চলুন",
  },
  { id: "salt-restriction", en: "Salt restriction", bn: "লবণ কম খান" },
  {
    id: "walking",
    en: "Regular walking as tolerated",
    bn: "সামর্থ্য অনুযায়ী নিয়মিত হাঁটুন",
  },
  {
    id: "no-smoking",
    en: "Avoid smoking and alcohol",
    bn: "ধূমপান ও মদ্যপান এড়িয়ে চলুন",
  },
  { id: "saline-gargle", en: "Warm saline gargle", bn: "গরম লবণ পানি দিয়ে গার্গল করুন" },
  {
    id: "wound-care",
    en: "Wound care as demonstrated",
    bn: "দেখানো অনুযায়ী ক্ষত পরিচর্যা",
  },
  {
    id: "return-if-worse",
    en: "Return if worse or new symptoms",
    bn: "অবনতি বা নতুন লক্ষণ হলে ফিরে আসুন",
  },
  {
    id: "bowel-care",
    en: "Drink plenty of water. Keep stool soft. Eat adequate vegetables. Do not strain at stool.",
    bn: "পানি বেশি খাবেন।\nপায়খানা নরম রাখবেন।\nপরিমাণ মত শাক-সবজি খাবেন।\nপায়খানায় বসে চাপ দিবেন না।",
  },
  {
    id: "rectocare-oint",
    en: "Rectocare Oint.: apply to the anal area as directed. Headache may occur after use — if mild, apply at night only; if severe, stop the ointment and inform the doctor.",
    bn: "Rectocare মলম: নির্দেশ অনুযায়ী পায়খানার রাস্তায় লাগাবেন।\nমলম লাগানোর পর মাথা ব্যাথা হইতে পারে।\nমাথা ব্যাথা হলে শুধু রাতে লাগাবেন।\nপ্রচন্ড মাথা ব্যাথা হলে লাগানো বন্ধ করবেন।",
  },
  {
    id: "jasocaine-jelly",
    en: "2% Jasocaine jelly — use as directed before the procedure.",
    bn: "২% Jasocaine জেলি — নির্দেশ অনুযায়ী ব্যবহার করুন।",
  },
  {
    id: "dobesil-ld",
    en: "Dobesil-LD ointment: apply in the anal canal as written on the prescription.",
    bn: "Dobesil-LD মলম: প্রেসক্রিপশনে লেখা নিয়ম অনুযায়ী পায়ুপথে ব্যবহার করবেন।",
  },
  {
    id: "sitz-bath",
    en: "Warm sitz bath twice daily and after each bowel movement.",
    bn: "দিনে ২ বার ও প্রতিবার পায়খানার পর কুসুম গরম পানিতে সিটজ বাথ নিবেন।",
  },
  {
    id: "post-op-review",
    en: "Return for wound review and stitch removal as advised.",
    bn: "পরামর্শ অনুযায়ী ক্ষত দেখাতে ও সেলাই কাটাতে আসবেন।",
  },
];

export type AnatomyRegion = { id: string; label: string; labelBn: string };

export const ANATOMY_REGIONS: AnatomyRegion[] = [
  { id: "head", label: "Head / face", labelBn: "মাথা / মুখ" },
  { id: "neck", label: "Neck / thyroid", labelBn: "গলা / থাইরয়েড" },
  { id: "chest", label: "Chest / breast", labelBn: "বুক / স্তন" },
  { id: "abdomen", label: "Abdomen", labelBn: "পেট" },
  { id: "pelvis", label: "Pelvis / perineum", labelBn: "শ্রোণি / পেরিনিয়াম" },
  { id: "upper_limb", label: "Upper limb", labelBn: "উপরের অঙ্গ" },
  { id: "lower_limb", label: "Lower limb", labelBn: "নিচের অঙ্গ" },
  { id: "back", label: "Back / spine", labelBn: "পিঠ / মেরুদণ্ড" },
];

/** Quick-pick chips shown on each medicine line. */
export const FREQUENCY_PRESETS = ["OD", "BD", "TDS", "QDS", "HS", "PRN", "STAT", "1+0+1", "1+1+1"];
export const DURATION_PRESETS = ["3 days", "5 days", "7 days", "10 days", "14 days", "1 month", "3 months"];
export const INSTRUCTION_PRESETS = [
  "After food",
  "Before food",
  "Empty stomach",
  "At bedtime",
  "With plenty of water",
];
