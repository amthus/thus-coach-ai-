/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'fr' | 'en';

export const i18n = {
  fr: {
    // Landing
    landingTitle: "STRIDE_IA",
    landingTagline: "PROTOCOLES D'ENTRAÎNEMENT PHYSIOLOGIQUE SUR-MESURE",
    landingDesc: "Une architecture d'entraînement de course à pied assistée par une IA sécurisée. Calculez vos zones de fréquence cardiaque et profitez de séances de haute précision adaptées à vos antécédents physiologiques.",
    landingEnter: "ENTRER DANS L'APPLICATION",
    landingFeatureRealism: "ARCHITECTURES RÉALISTES",
    landingFeatureRealismDesc: "Planification basée sur des blocs physiologiques d'endurance fondamentale et de fractionnés calculés selon la méthode de Karvonen.",
    landingFeatureSecurity: "SÉCURITÉ OPTIMISÉE",
    landingFeatureSecurityDesc: "Isolation des requêtes d'IA. Vos clés d'API et informations sensibles sont stockées uniquement côté serveur, réduisant la surface d'attaque.",
    landingFeaturePrecision: "DIAGNOSTICS TECHNIQUES",
    landingFeaturePrecisionDesc: "Génération de plans analytiques complets intégrant un outil d'allures, des indicateurs de charge de travail et la prévention des douleurs.",

    // Core application tabs
    tabCalendar: "01. CALENDRIER",
    tabChat: "02. COACH CHAT",
    tabPhysiology: "03. ENTRAÎNEMENT ANALYTIQUE",

    // Profile options
    profileTitle: "PROFIL ATHLÈTE",
    age: "ÂGE (ANS)",
    frequency: "SESSIONS / SEMAINE",
    level: "NIVEAU",
    levelNovice: "Novice",
    levelAmateur: "Amateur",
    levelElite: "Elite",
    footingDistance: "DISTANCE MINIMALE HABITUELLE",
    objectiveLabel: "OBJECTIF PRINCIPAL",
    physicalConstraints: "LIMITES PHYSIQUES / DOUBLEURS",
    physicalConstraintsPlaceholder: "Ex: Douleur tendon, rotule instable",
    customDetails: "OBJECTIF SECONDAIRE / DATE CIBLE",
    customDetailsPlaceholder: "Ex: Moins de 50 minutes au 10 km",
    coachChoice: "CHOIX DE LA MÉTHODE DU COACH",
    generatePlanBtn: "CALCULER MON PROTOCOLE",
    generatingPlanBtn: "CALCUL EN COURS...",
    resetBtn: "Réinitialiser",
    recommencer: "RECOMMENCER",
    beta: "PRODUCTION VERIFIED",

    // Objectives
    objSante: "Santé et Remise en forme",
    obj5k: "Premier 5 km",
    obj10k: "Réussir un 10 km",
    objSemi: "Semi-Marathon (21.1 km)",
    objMarathon: "Marathon Mythique (42.2 km)",
    objVitesse: "Vitesse pure et VMA",

    // Pace Calc widget
    paceCalcTitle: "CALCULATEUR D'ALLURE D'ATHLÈTE",
    paceDistance: "Distance (mètres)",
    paceDuration: "Durée",
    paceHr: "heures",
    paceMin: "minutes",
    paceSec: "secondes",
    paceResult: "Vitesse & Allure estimées :",
    paceSpeedLabel: "Vitesse :",
    paceMinKmLabel: "Allure :",

    // Physiology component
    physioTitle: "DIAGNOSTIC PHYSIOLOGIQUE & ZONES CARDIAQUES",
    physioDesc: "Ajustez vos données pour calibrer précisément vos zones cibles d'entraînement sur le modèle de Karvonen.",
    physioFcm: "Fréquence Cardiaque Maximale (FCM)",
    physioFcr: "Fréquence Cardiaque de Repos (FCR)",
    physioFcmDesc: "Estimée à 220 - âge ou rentrez votre valeur de test terrain.",
    physioFcrDesc: "Mesurée le matin au réveil.",
    physioReserve: "Fréquence Cardiaque de Réserve",
    physioZoneName: "Zone d'Entraînement",
    physioZoneRange: "Fréquents cardiaques",
    physioZoneEffort: "Nature de l'Effort",
    physioZone1: "Z1 - Récupération active (50-60% FCR)",
    physioZone1Desc: "Régénération musculaire active, échauffement et retour au calme.",
    physioZone2: "Z2 - Endurance Fondamentale (60-70% FCR)",
    physioZone2Desc: "Aérobie de base. Métabolisme lipidique. Développement du réseau capillaire.",
    physioZone3: "Z3 - Capacité Aérobie (70-80% FCR)",
    physioZone3Desc: "Tempo, allures de marathon. Travail d'efficacité cardiorespiratoire.",
    physioZone4: "Z4 - Seuil Lactique / Anaérobie (80-90% FCR)",
    physioZone4Desc: "Transition anaérobie. Capacité à tolérer l'acide lactique. Allure semi/10k.",
    physioZone5: "Z5 - Puissance Maximale Aérobie (90-100% FCR)",
    physioZone5Desc: "Fractionnés courts, VMA. Développement du volume d'éjection systolique.",

    // Coach panel placeholder
    noPlanTitle: "AUCUN PROTOCOLE ENCOURS",
    noPlanText: "Configurez vos données d'athlète sur la gauche afin de calculer votre premier programme d'entraînement assisté par IA.",
    coachTipsTitle: "CONSIGNE GLOBALE :",
    completedSessionsLabel: "SESSIONS COMPLÉTÉES",

    // Chat
    activeCoachHeader: "COACH CARDIO ASSISTANT",
    coachChatPlaceholder: "Parlez à votre coach athlétique...",
    emptyChatWelcome: "Sélectionnez vos critères et créez un programme pour poser des questions de récupération, d'équipement ou d'endurance fondamentale.",

    // General
    backToLanding: "RETOUR ACCUEIL"
  },
  en: {
    // Landing
    landingTitle: "STRIDE_IA",
    landingTagline: "TAILORED PHYSIOLOGICAL TRAINING PROTOCOLS",
    landingDesc: "An advanced running architecture powered by secure artificial intelligence. Compute your heart rate training zones and get high-precision workouts configured for your physical history.",
    landingEnter: "ENTER APPLICATION",
    landingFeatureRealism: "REALISTIC TRAINING",
    landingFeatureRealismDesc: "Planning based on physiological blocks of aerobic base or intervals according to the tested Karvonen HR formula.",
    landingFeatureSecurity: "HIGH END SECURITY",
    landingFeatureSecurityDesc: "Secure request isolation. Your API keys and personal parameters are kept server-side, reducing security exposure.",
    landingFeaturePrecision: "ANALYTICAL DIAGNOSTICS",
    landingFeaturePrecisionDesc: "Detailed plan synthesis featuring customized pace calculator, workload parameters and injury mitigation.",

    // Core application tabs
    tabCalendar: "01. CALENDAR",
    tabChat: "02. COACH CHAT",
    tabPhysiology: "03. PHYSIOLOGICAL ENGINE",

    // Profile options
    profileTitle: "ATHLETE PROFILE",
    age: "AGE (YEARS)",
    frequency: "SESSIONS / WEEK",
    level: "ATHLETE LEVEL",
    levelNovice: "Novice",
    levelAmateur: "Amateur",
    levelElite: "Elite",
    footingDistance: "CURRENT MINIMUM AVERAGE DISTANCE",
    objectiveLabel: "CORE OBJECTIVE",
    physicalConstraints: "PHYSICAL PATHOLOGIES / INJURIES",
    physicalConstraintsPlaceholder: "E.g., Tendonitis, knee pain history",
    customDetails: "SECONDARY TARGET / TARGET TIME",
    customDetailsPlaceholder: "E.g., Complete 10k within 50 minutes",
    coachChoice: "SELECT COACH METHODOLOGY",
    generatePlanBtn: "CALCULATE WORKOUTS",
    generatingPlanBtn: "CALCULATING MODEL...",
    resetBtn: "Reset",
    recommencer: "RESET DEVICE",
    beta: "PRODUCTION VERIFIED",

    // Objectives
    objSante: "Health and General Fitness",
    obj5k: "First 5 KM Run",
    obj10k: "Complete a 10 KM Run",
    objSemi: "Half-Marathon (21.1 KM)",
    objMarathon: "Legendary Marathon (42.2 KM)",
    objVitesse: "Speed and VO2 Max Boost",

    // Pace Calc widget
    paceCalcTitle: "ATHLETE PACE CALCULATOR",
    paceDistance: "Distance (meters)",
    paceDuration: "Duration",
    paceHr: "hours",
    paceMin: "minutes",
    paceSec: "seconds",
    paceResult: "Estimated Speed & Pace:",
    paceSpeedLabel: "Speed:",
    paceMinKmLabel: "Pace:",

    // Physiology component
    physioTitle: "PHYSIOLOGY DIAGNOSTIC & HEART ZONES",
    physioDesc: "Fine-tune values to calibrate heart training targets according to the Karvonen calculation.",
    physioFcm: "Max Heart Rate (MHR)",
    physioFcr: "Resting Heart Rate (RHR)",
    physioFcmDesc: "Traditionally estimated at 220 - age, or set your active test values.",
    physioFcrDesc: "Measured in the morning upon waking up.",
    physioReserve: "Heart Rate Reserve (HRR)",
    physioZoneName: "HR Target Zone",
    physioZoneRange: "Target Beats range",
    physioZoneEffort: "Type of physiological adaptation",
    physioZone1: "Z1 - Recovery (50-60% HRR)",
    physioZone1Desc: "Active muscular regeneration, light warmup and cooldown exercises.",
    physioZone2: "Z2 - Aerobic Base / Fundamental Endurance (60-70% HRR)",
    physioZone2Desc: "Aerobic standard. Maximizes lipid metabolism. Stimulates deep cell capillary networks.",
    physioZone3: "Z3 - Aerobic Power (70-80% HRR)",
    physioZone3Desc: "Aerobic capacity. Standard tempo, marathon target pace. Enhances cardiorespiratory efficiency.",
    physioZone4: "Z4 - Lactate Threshold / Anaerobic Transition (80-90% HRR)",
    physioZone4Desc: "Builds high lactate tolerance. Transition to anaerobic, half-marathon or 10k racing pace.",
    physioZone5: "Z5 - VO2 Max / Maximum Aerobic Output (90-100% HRR)",
    physioZone5Desc: "Short intervals, intense workouts. Improves stroke volume and maximum oxygen absorption.",

    // Coach panel placeholder
    noPlanTitle: "NO WORKOUT PROTOCOL IN SESSION",
    noPlanText: "Fill in your athlete coordinates on the left panel to output your custom AI-driven running training routine.",
    coachTipsTitle: "COACH PROTOCOL DIRECTIVE:",
    completedSessionsLabel: "COMPLETED SESSIONS",

    // Chat
    activeCoachHeader: "CARDIO COACH CHAT",
    coachChatPlaceholder: "Ask your virtual head coach...",
    emptyChatWelcome: "Submit your training goals on the left profile tab to initialize coach interaction regarding gear, nutrition or resting cycles.",

    // General
    backToLanding: "BACK HOME"
  }
};
