export const procedureOptions = [
  { value: "threeDNippleTattooing", label: "3D Nipple Tattooing" },
  { value: "breastAugmentation", label: "Breast Augmentation" },
  { value: "breastReduction", label: "Breast Reduction" },
  { value: "breastLiftMastopexy", label: "Breast Lift Mastopexy" },
  { value: "nippleReconstruction", label: "Nipple Reconstruction" }
];

export const entProcedureOptions = [
  { value: "fess", label: "FESS" },
  { value: "rhinoplasty", label: "Rhinoplasty" },
  { value: "tonsillectomy", label: "Tonsillectomy" },
  { value: "adenoidectomy", label: "Adenoidectomy" },
  { value: "sinusSurgery", label: "Sinus Surgery" },
  { value: "septoplasty", label: "Septoplasty" }
];

export const gastroenterologyOptions = [
  { value: "upperGiEndoscopy", label: "Upper GI Endoscopy" },
  { value: "lowerGiEndoscopy", label: "Lower GI Endoscopy" }
];

export const generalSurgeryOptions = [
  { value: "herniaRepair", label: "Hernia Repair" },
  { value: "laparoscopicCholecystectomy", label: "Laparoscopic Cholecystectomy" },
  { value: "analSkinTag", label: "Anal Skin Tag" },
  { value: "haemorrhoidsPilesTreatment", label: "Haemorrhoids Piles Treatment" }
];

export const gynaecologyTreatmentOptions = [
  { value: "labiaplasty", label: "Labiaplasty" },
  { value: "vaginalTightening", label: "Vaginal Tightening" },
  { value: "endometrialAblation", label: "Endometrial Ablation" },
  { value: "prolapseRepair", label: "Prolapse Repair" },
  { value: "hysterectomy", label: "Hysterectomy" },
  { value: "urinaryIncontinence", label: "Urinary Incontinence" }
];

export const orthopaedicTreatmentOptions = [
  { value: "kneeReplacement", label: "Knee Replacement" },
  { value: "hipReplacement", label: "Hip Replacement" },
  { value: "kneeArthroscopy", label: "Knee Arthroscopy" },
  { value: "shoulderReplacement", label: "Shoulder Replacement" },
  { value: "sportsInjury", label: "Sports Injury" },
  { value: "jointInjections", label: "Joint Injections" },
  { value: "shoulderDecompression", label: "Shoulder Decompression" },
  { value: "shoulderStabilization", label: "Shoulder Stabilization" },
  { value: "rotatorCuffRepair", label: "Rotator Cuff Repair" },
  { value: "elbowReplacement", label: "Elbow Replacement" },
  { value: "tennisElbowRelease", label: "Tennis Elbow Release" }
];

export const electivaTreatmentsOptions = [
  { value: "generalSurgery", label: "General Surgery" },
  { value: "orthopaedics", label: "Orthopaedics" },
  { value: "gynaecology", label: "Gynaecology" },
  { value: "urology", label: "Urology" },
  { value: "gastroenterology", label: "Gastroenterology" },
  { value: "breastSurgery", label: "Breast Surgery" },
  { value: "entSurgery", label: "ENT Surgery" }
];

export const treatmentOptions = [
  ...procedureOptions,
  ...entProcedureOptions,
  ...gastroenterologyOptions,
  ...generalSurgeryOptions,
  ...gynaecologyTreatmentOptions,
  ...orthopaedicTreatmentOptions
];

export const apiCallOptions = [
  { value: "1", label: "1st call" },
  { value: "2", label: "2nd call" },
  { value: "3", label: "3rd call" },
  { value: "4", label: "4th call" },
  { value: "5", label: "5th call" },
  { value: "6", label: "6th call" },
  { value: "7", label: "7th call" },
  { value: "8", label: "8th call" },
  { value: "9", label: "9th call" },
  { value: "10", label: "10th call" }
];

export const currencyOptions = [
  { value: "USD", label: "USD - United States Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound Sterling" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CNY", label: "CNY - Chinese Yuan" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "SEK", label: "SEK - Swedish Krona" },
  { value: "NZD", label: "NZD - New Zealand Dollar" },
  { value: "SGD", label: "SGD - Singapore Dollar" },
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "NOK", label: "NOK - Norwegian Krone" },
  { value: "KRW", label: "KRW - South Korean Won" },
  { value: "TRY", label: "TRY - Turkish Lira" },
  { value: "RUB", label: "RUB - Russian Ruble" },
  { value: "BRL", label: "BRL - Brazilian Real" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "MXN", label: "MXN - Mexican Peso" }
];
