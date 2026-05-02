// jargon.js – Multi-region government abbreviation dictionaries.
// Each region has its own dict; content.js picks the dict matching the page's
// detected region (window.GOVLENS_REGIONS.detectRegion).
//
// Exposes:
//   window.GOVLENS_JARGON_BY_REGION = { IN: {...}, GB: {...}, US: {...}, ... }
//   window.GOVLENS_JARGON_REGEX_FOR(regionCode) → RegExp matching that region's terms
//
// India ships full (~80 terms). UK and US ship starter sets that should be
// expanded. Other regions inherit the global default (an empty dict + no
// highlighting) until contributors add terms.

(function () {

  // ─────────────────────────────  INDIA  ─────────────────────────────
  const IN = {
    PAN: { full: "Permanent Account Number", desc: "10-character ID issued by Income Tax Dept." },
    TAN: { full: "Tax Deduction & Collection Account Number", desc: "ID for entities deducting/collecting tax at source." },
    GSTIN: { full: "GST Identification Number", desc: "15-digit number for GST-registered businesses." },
    UID: { full: "Unique Identification (Aadhaar)", desc: "12-digit Aadhaar number issued by UIDAI." },
    EID: { full: "Enrolment ID (Aadhaar)", desc: "28-digit temporary ID given on Aadhaar enrolment." },
    VID: { full: "Virtual ID (Aadhaar)", desc: "16-digit revocable Aadhaar substitute." },
    HUF: { full: "Hindu Undivided Family", desc: "Family treated as a single tax entity under Indian law." },
    NRI: { full: "Non-Resident Indian", desc: "Indian citizen residing outside India." },
    OCI: { full: "Overseas Citizen of India", desc: "Lifelong visa for foreign nationals of Indian origin." },
    PIO: { full: "Person of Indian Origin", desc: "Older category, mostly merged into OCI." },
    TDS: { full: "Tax Deducted at Source", desc: "Tax withheld by payer before paying you." },
    TCS: { full: "Tax Collected at Source", desc: "Tax collected by seller from buyer at point of sale." },
    GST: { full: "Goods & Services Tax", desc: "Unified indirect tax on goods and services." },
    CGST: { full: "Central GST", desc: "Centre's share of GST on intra-state sales." },
    SGST: { full: "State GST", desc: "State's share of GST on intra-state sales." },
    IGST: { full: "Integrated GST", desc: "GST on inter-state sales, collected by Centre." },
    UTGST: { full: "Union Territory GST", desc: "GST in Union Territories without legislatures." },
    ITR: { full: "Income Tax Return", desc: "Annual tax filing form (ITR-1 to ITR-7)." },
    AY: { full: "Assessment Year", desc: "Year you file taxes for income earned in the previous year." },
    FY: { full: "Financial Year", desc: "April 1 to March 31 in India." },
    UIDAI: { full: "Unique Identification Authority of India", desc: "Issues Aadhaar." },
    CBDT: { full: "Central Board of Direct Taxes", desc: "Apex direct-tax body." },
    CBIC: { full: "Central Board of Indirect Taxes & Customs", desc: "Apex body for GST, customs, excise." },
    EPFO: { full: "Employees' Provident Fund Organisation", desc: "Manages PF, pension for organised-sector employees." },
    ESIC: { full: "Employees' State Insurance Corporation", desc: "Health/social security for low-wage workers." },
    NIC: { full: "National Informatics Centre", desc: "Govt's IT services arm; runs many .nic.in / .gov.in sites." },
    NPCI: { full: "National Payments Corporation of India", desc: "Operates UPI, RuPay, IMPS, BHIM." },
    RBI: { full: "Reserve Bank of India", desc: "India's central bank." },
    SEBI: { full: "Securities & Exchange Board of India", desc: "Stock-market regulator." },
    IRDAI: { full: "Insurance Regulatory & Development Authority", desc: "Insurance-sector regulator." },
    TRAI: { full: "Telecom Regulatory Authority of India", desc: "Telecom regulator." },
    FSSAI: { full: "Food Safety & Standards Authority of India", desc: "Food-safety regulator." },
    BIS: { full: "Bureau of Indian Standards", desc: "Indian product standards (ISI mark)." },
    NITI: { full: "NITI Aayog", desc: "Government's policy think-tank." },
    ISRO: { full: "Indian Space Research Organisation", desc: "National space agency." },
    DRDO: { full: "Defence Research & Development Organisation", desc: "Defence R&D agency." },
    UPSC: { full: "Union Public Service Commission", desc: "Civil-services exams." },
    SSC: { full: "Staff Selection Commission", desc: "Recruits for non-gazetted central posts." },
    PMJAY: { full: "Pradhan Mantri Jan Arogya Yojana", desc: "Health insurance up to ₹5L/year for poor families." },
    PMAY: { full: "Pradhan Mantri Awas Yojana", desc: "Affordable housing scheme." },
    MGNREGA: { full: "Mahatma Gandhi National Rural Employment Guarantee Act", desc: "100 days' wage employment per rural household per year." },
    NREGA: { full: "National Rural Employment Guarantee Act", desc: "Older name of MGNREGA." },
    PMKVY: { full: "Pradhan Mantri Kaushal Vikas Yojana", desc: "Skill-development scheme." },
    PMJDY: { full: "Pradhan Mantri Jan Dhan Yojana", desc: "Zero-balance bank accounts." },
    PMSBY: { full: "Pradhan Mantri Suraksha Bima Yojana", desc: "₹2L accident insurance for ₹20/year." },
    PMJJBY: { full: "Pradhan Mantri Jeevan Jyoti Bima Yojana", desc: "₹2L life insurance for ~₹436/year." },
    APY: { full: "Atal Pension Yojana", desc: "Guaranteed pension for unorganised sector." },
    NPS: { full: "National Pension System", desc: "Voluntary contributory pension." },
    EPF: { full: "Employees' Provident Fund", desc: "Retirement savings for organised-sector employees." },
    EPS: { full: "Employees' Pension Scheme", desc: "Pension component within EPFO." },
    PDS: { full: "Public Distribution System", desc: "Subsidised foodgrain via ration shops." },
    NFSA: { full: "National Food Security Act", desc: "Legal right to subsidised foodgrains." },
    CGHS: { full: "Central Government Health Scheme", desc: "Healthcare for central govt employees and pensioners." },
    AYUSH: { full: "Ayurveda, Yoga, Unani, Siddha, Homoeopathy", desc: "Ministry for traditional Indian medicine." },
    AIIMS: { full: "All India Institute of Medical Sciences", desc: "Premier public medical institutes." },
    ICMR: { full: "Indian Council of Medical Research", desc: "Apex biomedical research body." },
    NHM: { full: "National Health Mission", desc: "Umbrella health scheme." },
    CBSE: { full: "Central Board of Secondary Education", desc: "Largest school board (X / XII)." },
    UGC: { full: "University Grants Commission", desc: "Higher-education regulator." },
    AICTE: { full: "All India Council for Technical Education", desc: "Technical-education regulator." },
    NCERT: { full: "National Council of Educational Research & Training", desc: "Curriculum + textbooks." },
    NEET: { full: "National Eligibility cum Entrance Test", desc: "Medical-admission exam." },
    JEE: { full: "Joint Entrance Examination", desc: "Engineering admission exam." },
    CUET: { full: "Common University Entrance Test", desc: "Central university entrance." },
    FIR: { full: "First Information Report", desc: "Police report registering a cognisable offence." },
    PIL: { full: "Public Interest Litigation", desc: "Petition in public interest." },
    RTI: { full: "Right to Information", desc: "2005 law; lets citizens request public-authority info." },
    FCRA: { full: "Foreign Contribution Regulation Act", desc: "Regulates foreign donations to NGOs." },
    FEMA: { full: "Foreign Exchange Management Act", desc: "Regulates forex transactions." },
    IBC: { full: "Insolvency & Bankruptcy Code", desc: "2016 corporate-insolvency law." },
    NCLT: { full: "National Company Law Tribunal", desc: "Adjudicates company law and insolvency." },
    NCLAT: { full: "National Company Law Appellate Tribunal", desc: "Appeals from NCLT." },
    EWS: { full: "Economically Weaker Section", desc: "10% reservation for low-income general-category households." },
    BPL: { full: "Below Poverty Line", desc: "Welfare-scheme eligibility category." },
    OBC: { full: "Other Backward Class", desc: "Reservation category." },
    KYC: { full: "Know Your Customer", desc: "Identity verification process." },
    OTP: { full: "One-Time Password", desc: "Short-lived verification code." },
    UPI: { full: "Unified Payments Interface", desc: "Real-time bank-to-bank payment system." },
    NEFT: { full: "National Electronic Funds Transfer", desc: "Batch-processed bank transfer." },
    RTGS: { full: "Real Time Gross Settlement", desc: "Instant high-value bank transfer." },
    IMPS: { full: "Immediate Payment Service", desc: "24×7 instant interbank fund transfer." },
    IFSC: { full: "Indian Financial System Code", desc: "11-character branch code." },
    DBT: { full: "Direct Benefit Transfer", desc: "Subsidy paid directly to beneficiary's bank." },
    PPF: { full: "Public Provident Fund", desc: "15-year tax-free savings scheme." },
    NOC: { full: "No Objection Certificate", desc: "Document stating issuer has no objection." },
    PSU: { full: "Public Sector Undertaking", desc: "Government-owned company." },
    IAS: { full: "Indian Administrative Service", desc: "Premier civil service." },
    IPS: { full: "Indian Police Service", desc: "Premier police-leadership service." },
    IRS: { full: "Indian Revenue Service", desc: "Tax-administration civil service." }
  };

  // ─────────────────────────────  UK  ─────────────────────────────
  const GB = {
    HMRC: { full: "His Majesty's Revenue & Customs", desc: "UK tax & customs authority." },
    NHS:  { full: "National Health Service", desc: "Publicly-funded healthcare service." },
    DWP:  { full: "Department for Work and Pensions", desc: "Welfare and pensions ministry." },
    DVLA: { full: "Driver & Vehicle Licensing Agency", desc: "Issues driving licences and vehicle registration." },
    NIN:  { full: "National Insurance Number", desc: "Personal account number for tax/benefits (e.g. AB123456C)." },
    NI:   { full: "National Insurance", desc: "Mandatory contribution towards state benefits." },
    PAYE: { full: "Pay As You Earn", desc: "Tax & NI deducted from wages by employer." },
    VAT:  { full: "Value Added Tax", desc: "Tax on goods/services; standard rate 20%." },
    ISA:  { full: "Individual Savings Account", desc: "Tax-free savings/investment account." },
    UTR:  { full: "Unique Taxpayer Reference", desc: "10-digit reference for self-assessment filers." },
    HMPO: { full: "HM Passport Office", desc: "Issues UK passports." },
    DBS:  { full: "Disclosure & Barring Service", desc: "Criminal-record checks for jobs/volunteering." },
    UC:   { full: "Universal Credit", desc: "Means-tested benefit replacing six legacy benefits." },
    PIP:  { full: "Personal Independence Payment", desc: "Benefit for living with long-term illness/disability." },
    ESA:  { full: "Employment & Support Allowance", desc: "Benefit if you can't work due to illness/disability." },
    JSA:  { full: "Jobseeker's Allowance", desc: "Benefit while looking for work." },
    MoT:  { full: "Ministry of Transport (test)", desc: "Annual roadworthiness test for vehicles ≥3 years old." }
  };

  // ─────────────────────────────  USA  ─────────────────────────────
  const US = {
    SSN:    { full: "Social Security Number", desc: "9-digit identifier issued by SSA." },
    SSA:    { full: "Social Security Administration", desc: "Issues SSNs and pays retirement/disability benefits." },
    IRS:    { full: "Internal Revenue Service", desc: "Federal tax-collection agency." },
    EIN:    { full: "Employer Identification Number", desc: "9-digit IRS ID for businesses." },
    ITIN:   { full: "Individual Taxpayer Identification Number", desc: "Tax-processing ID for those without SSN eligibility." },
    FICA:   { full: "Federal Insurance Contributions Act", desc: "Payroll tax funding Social Security & Medicare." },
    "401K": { full: "401(k)", desc: "Employer-sponsored retirement savings plan." },
    IRA:    { full: "Individual Retirement Account", desc: "Tax-advantaged retirement savings." },
    HSA:    { full: "Health Savings Account", desc: "Tax-advantaged account for medical expenses (with HDHP)." },
    FAFSA:  { full: "Free Application for Federal Student Aid", desc: "Application for federal college aid." },
    SNAP:   { full: "Supplemental Nutrition Assistance Program", desc: "Food-stamp benefits, paid via EBT card." },
    EBT:    { full: "Electronic Benefit Transfer", desc: "Card used to pay SNAP/cash benefits." },
    WIC:    { full: "Women, Infants and Children", desc: "Federal nutrition assistance for low-income mothers." },
    CMS:    { full: "Centers for Medicare & Medicaid Services", desc: "Administers Medicare/Medicaid." },
    HHS:    { full: "Health & Human Services", desc: "Cabinet department for health/welfare programs." },
    USCIS:  { full: "U.S. Citizenship & Immigration Services", desc: "Immigration benefits agency." },
    DHS:    { full: "Department of Homeland Security", desc: "Border & immigration parent department." },
    FBI:    { full: "Federal Bureau of Investigation", desc: "Federal law-enforcement agency." },
    DMV:    { full: "Department of Motor Vehicles", desc: "State agency issuing driver's licences." },
    DOL:    { full: "Department of Labor", desc: "Federal labour-policy department." },
    EPA:    { full: "Environmental Protection Agency", desc: "Federal environmental regulator." },
    OSHA:   { full: "Occupational Safety & Health Administration", desc: "Workplace-safety regulator." },
    SEC:    { full: "Securities & Exchange Commission", desc: "Federal securities regulator." },
    FDIC:   { full: "Federal Deposit Insurance Corporation", desc: "Bank-deposit insurance up to $250k." },
    FCC:    { full: "Federal Communications Commission", desc: "Communications regulator." },
    FAA:    { full: "Federal Aviation Administration", desc: "Civil aviation regulator." }
  };

  const BY_REGION = { IN, GB, US };

  function buildRegex(dict) {
    const terms = Object.keys(dict).sort((a, b) => b.length - a.length);
    if (!terms.length) return /(?!)/; // never matches
    const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp('\\b(' + escaped.join('|') + ')\\b', 'g');
  }

  // Cache regexes per region
  const REGEX_CACHE = {};
  function regexFor(regionCode) {
    if (!regionCode) return null;
    if (REGEX_CACHE[regionCode]) return REGEX_CACHE[regionCode];
    const dict = BY_REGION[regionCode];
    if (!dict) return null;
    REGEX_CACHE[regionCode] = buildRegex(dict);
    return REGEX_CACHE[regionCode];
  }

  function dictFor(regionCode) {
    return BY_REGION[regionCode] || null;
  }

  if (typeof window !== 'undefined') {
    window.GOVLENS_JARGON_BY_REGION = BY_REGION;
    window.GOVLENS_JARGON_DICT_FOR = dictFor;
    window.GOVLENS_JARGON_REGEX_FOR = regexFor;

    // Backwards-compatibility shim — older code referenced these.
    window.GOVLENS_JARGON = IN;
    window.GOVLENS_JARGON_REGEX = buildRegex(IN);
  }
})();
