export const LANGUAGE_STORAGE_KEY = "facegrem-language";

export const languages = [
  "English (UK)",
  "Kiswahili",
  "Français (France)",
  "Español",
  "Português (Brasil)",
  "العربية",
  "Deutsch",
] as const;

export type Language = (typeof languages)[number];

export type CommonTranslations = {
  brandName: string;
  footerMoreLanguages: string;
  footerSignup: string;
  footerLogin: string;
  footerVideo: string;
  footerThreads: string;
  footerPrivacyPolicy: string;
  footerPrivacyCentre: string;
  footerAbout: string;
  footerCreateAd: string;
  footerCreatePage: string;
  footerDevelopers: string;
  footerCareers: string;
  footerCookies: string;
  footerAdChoices: string;
  footerTerms: string;
  footerHelp: string;
  footerContactUploading: string;
  languageChanged: string;
};

export type LandingTranslations = CommonTranslations & {
  welcome: string;
  hero: string;
  loginTitle: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  loginButton: string;
  forgotPassword: string;
  createAccount: string;
  loggingIn: string;
  loginValidation: string;
  forgotPasswordAlert: string;
};

export type SignupTranslations = CommonTranslations & {
  back: string;
  pageTitle: string;
  pageSubtitle: string;
  name: string;
  firstName: string;
  surname: string;
  dateOfBirth: string;
  day: string;
  month: string;
  year: string;
  gender: string;
  selectGender: string;
  female: string;
  male: string;
  custom: string;
  preferNotToSay: string;
  emailOrPhone: string;
  emailOrPhonePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  contactInfoHelp: string;
  termsTextOne: string;
  termsTextTwo: string;
  submit: string;
  creatingAccount: string;
  alreadyHaveAccount: string;
  fillAllFields: string;
  passwordTooShort: string;
  emailOnly: string;
  signupSuccess: string;
};

type TranslationRecord = {
  landing: LandingTranslations;
  signup: SignupTranslations;
};

const commonTranslations: Record<Language, CommonTranslations> = {
  "English (UK)": {
    brandName: "FaceGrem",
    footerMoreLanguages: "More languages…",
    footerSignup: "Sign up",
    footerLogin: "Log in",
    footerVideo: "Video",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Privacy Policy",
    footerPrivacyCentre: "Privacy Centre",
    footerAbout: "About",
    footerCreateAd: "Create ad",
    footerCreatePage: "Create Page",
    footerDevelopers: "Developers",
    footerCareers: "Careers",
    footerCookies: "Cookies",
    footerAdChoices: "AdChoices",
    footerTerms: "Terms",
    footerHelp: "Help",
    footerContactUploading: "Contact uploading and non-users",
    languageChanged: "Language switched to English (UK).",
  },
  Kiswahili: {
    brandName: "FaceGrem",
    footerMoreLanguages: "Lugha zaidi…",
    footerSignup: "Jisajili",
    footerLogin: "Ingia",
    footerVideo: "Video",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Sera ya Faragha",
    footerPrivacyCentre: "Kituo cha Faragha",
    footerAbout: "Kuhusu",
    footerCreateAd: "Tengeneza tangazo",
    footerCreatePage: "Tengeneza Ukurasa",
    footerDevelopers: "Waendelezaji",
    footerCareers: "Ajira",
    footerCookies: "Vidakuzi",
    footerAdChoices: "Chaguo za Matangazo",
    footerTerms: "Masharti",
    footerHelp: "Msaada",
    footerContactUploading: "Mawasiliano yaliyopakiwa na wasiokuwa watumiaji",
    languageChanged: "Lugha imebadilishwa kuwa Kiswahili.",
  },
  "Français (France)": {
    brandName: "FaceGrem",
    footerMoreLanguages: "Plus de langues…",
    footerSignup: "S’inscrire",
    footerLogin: "Se connecter",
    footerVideo: "Vidéo",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Politique de confidentialité",
    footerPrivacyCentre: "Centre de confidentialité",
    footerAbout: "À propos",
    footerCreateAd: "Créer une publicité",
    footerCreatePage: "Créer une Page",
    footerDevelopers: "Développeurs",
    footerCareers: "Carrières",
    footerCookies: "Cookies",
    footerAdChoices: "Choix publicitaires",
    footerTerms: "Conditions",
    footerHelp: "Aide",
    footerContactUploading: "Importation de contacts et non-utilisateurs",
    languageChanged: "Langue changée en Français (France).",
  },
  Español: {
    brandName: "FaceGrem",
    footerMoreLanguages: "Más idiomas…",
    footerSignup: "Registrarte",
    footerLogin: "Iniciar sesión",
    footerVideo: "Vídeo",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Política de privacidad",
    footerPrivacyCentre: "Centro de privacidad",
    footerAbout: "Información",
    footerCreateAd: "Crear anuncio",
    footerCreatePage: "Crear página",
    footerDevelopers: "Desarrolladores",
    footerCareers: "Empleo",
    footerCookies: "Cookies",
    footerAdChoices: "Opciones de anuncios",
    footerTerms: "Términos",
    footerHelp: "Ayuda",
    footerContactUploading: "Carga de contactos y no usuarios",
    languageChanged: "Idioma cambiado a Español.",
  },
  "Português (Brasil)": {
    brandName: "FaceGrem",
    footerMoreLanguages: "Mais idiomas…",
    footerSignup: "Cadastre-se",
    footerLogin: "Entrar",
    footerVideo: "Vídeo",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Política de Privacidade",
    footerPrivacyCentre: "Central de Privacidade",
    footerAbout: "Sobre",
    footerCreateAd: "Criar anúncio",
    footerCreatePage: "Criar Página",
    footerDevelopers: "Desenvolvedores",
    footerCareers: "Carreiras",
    footerCookies: "Cookies",
    footerAdChoices: "Escolhas para anúncios",
    footerTerms: "Termos",
    footerHelp: "Ajuda",
    footerContactUploading: "Carregamento de contatos e não usuários",
    languageChanged: "Idioma alterado para Português (Brasil).",
  },
  العربية: {
    brandName: "FaceGrem",
    footerMoreLanguages: "المزيد من اللغات…",
    footerSignup: "إنشاء حساب",
    footerLogin: "تسجيل الدخول",
    footerVideo: "فيديو",
    footerThreads: "Threads",
    footerPrivacyPolicy: "سياسة الخصوصية",
    footerPrivacyCentre: "مركز الخصوصية",
    footerAbout: "حول",
    footerCreateAd: "إنشاء إعلان",
    footerCreatePage: "إنشاء صفحة",
    footerDevelopers: "المطورون",
    footerCareers: "الوظائف",
    footerCookies: "ملفات تعريف الارتباط",
    footerAdChoices: "خيارات الإعلانات",
    footerTerms: "الشروط",
    footerHelp: "المساعدة",
    footerContactUploading: "تحميل جهات الاتصال وغير المستخدمين",
    languageChanged: "تم تغيير اللغة إلى العربية.",
  },
  Deutsch: {
    brandName: "FaceGrem",
    footerMoreLanguages: "Weitere Sprachen…",
    footerSignup: "Registrieren",
    footerLogin: "Anmelden",
    footerVideo: "Video",
    footerThreads: "Threads",
    footerPrivacyPolicy: "Datenschutzrichtlinie",
    footerPrivacyCentre: "Datenschutzzentrum",
    footerAbout: "Info",
    footerCreateAd: "Werbeanzeige erstellen",
    footerCreatePage: "Seite erstellen",
    footerDevelopers: "Entwickler",
    footerCareers: "Karriere",
    footerCookies: "Cookies",
    footerAdChoices: "Anzeigenauswahl",
    footerTerms: "Nutzungsbedingungen",
    footerHelp: "Hilfe",
    footerContactUploading: "Kontakt-Uploads und Nicht-Nutzer",
    languageChanged: "Sprache wurde auf Deutsch umgestellt.",
  },
};

export const translations: Record<Language, TranslationRecord> = {
  "English (UK)": {
    landing: {
      ...commonTranslations["English (UK)"],
      welcome: "Welcome to FaceGrem",
      hero: "Your new social space to connect, share, and grow.",
      loginTitle: "Log in to FaceGrem",
      emailPlaceholder: "Email address or mobile number",
      passwordPlaceholder: "Password",
      loginButton: "Log in",
      forgotPassword: "Forgotten password?",
      createAccount: "Create new account",
      loggingIn: "Logging in...",
      loginValidation: "Enter your email and password.",
      forgotPasswordAlert: "Forgot password flow can be added next.",
    },
    signup: {
      ...commonTranslations["English (UK)"],
      back: "‹",
      pageTitle: "Get started on FaceGrem",
      pageSubtitle:
        "Create an account to connect with friends, family and communities of people who share your interests.",
      name: "Name",
      firstName: "First name",
      surname: "Surname",
      dateOfBirth: "Date of birth",
      day: "Day",
      month: "Month",
      year: "Year",
      gender: "Gender",
      selectGender: "Select your gender",
      female: "Female",
      male: "Male",
      custom: "Custom",
      preferNotToSay: "Prefer not to say",
      emailOrPhone: "Mobile number or email address",
      emailOrPhonePlaceholder: "Mobile number or email address",
      password: "Password",
      passwordPlaceholder: "Password",
      contactInfoHelp:
        "You may receive notifications from us. Learn why we ask for your contact information.",
      termsTextOne:
        "By tapping Submit, you agree to create an account and to FaceGrem's Terms, Privacy Policy and Cookies Policy.",
      termsTextTwo:
        "The Privacy Policy describes the ways we can use the information we collect when you create an account.",
      submit: "Submit",
      creatingAccount: "Creating account...",
      alreadyHaveAccount: "I already have an account",
      fillAllFields: "Please fill in all fields.",
      passwordTooShort: "Password must be at least 6 characters.",
      emailOnly:
        "For now, FaceGrem signup supports email. Please enter an email address.",
      signupSuccess:
        "Account created successfully. Check your email if confirmation is enabled.",
    },
  },
  Kiswahili: {
    landing: {
      ...commonTranslations.Kiswahili,
      welcome: "Karibu FaceGrem",
      hero: "Sehemu yako mpya ya kijamii ya kuunganika, kushiriki, na kukua.",
      loginTitle: "Ingia kwenye FaceGrem",
      emailPlaceholder: "Barua pepe au namba ya simu",
      passwordPlaceholder: "Nenosiri",
      loginButton: "Ingia",
      forgotPassword: "Umesahau nenosiri?",
      createAccount: "Fungua akaunti mpya",
      loggingIn: "Inaingia...",
      loginValidation: "Weka barua pepe na nenosiri lako.",
      forgotPasswordAlert: "Mfumo wa kusahau nenosiri unaweza kuongezwa baadaye.",
    },
    signup: {
      ...commonTranslations.Kiswahili,
      back: "‹",
      pageTitle: "Anza kutumia FaceGrem",
      pageSubtitle:
        "Fungua akaunti ili kuungana na marafiki, familia na jumuiya za watu wenye mambo mnayopenda sawa.",
      name: "Jina",
      firstName: "Jina la kwanza",
      surname: "Jina la ukoo",
      dateOfBirth: "Tarehe ya kuzaliwa",
      day: "Siku",
      month: "Mwezi",
      year: "Mwaka",
      gender: "Jinsia",
      selectGender: "Chagua jinsia yako",
      female: "Mwanamke",
      male: "Mwanaume",
      custom: "Nyingine",
      preferNotToSay: "Sipendi kusema",
      emailOrPhone: "Namba ya simu au barua pepe",
      emailOrPhonePlaceholder: "Namba ya simu au barua pepe",
      password: "Nenosiri",
      passwordPlaceholder: "Nenosiri",
      contactInfoHelp:
        "Unaweza kupokea arifa kutoka kwetu. Jifunze kwanini tunaomba mawasiliano yako.",
      termsTextOne:
        "Kwa kubofya Wasilisha, unakubali kufungua akaunti na Masharti, Sera ya Faragha na Sera ya Vidakuzi ya FaceGrem.",
      termsTextTwo:
        "Sera ya Faragha inaeleza namna tunavyoweza kutumia taarifa tunazokusanya unapofungua akaunti.",
      submit: "Wasilisha",
      creatingAccount: "Inafungua akaunti...",
      alreadyHaveAccount: "Tayari nina akaunti",
      fillAllFields: "Tafadhali jaza sehemu zote.",
      passwordTooShort: "Nenosiri lazima liwe na angalau herufi 6.",
      emailOnly:
        "Kwa sasa, usajili wa FaceGrem unatumia barua pepe. Tafadhali andika barua pepe.",
      signupSuccess:
        "Akaunti imefunguliwa kwa mafanikio. Angalia barua pepe yako kama uthibitisho umewezeshwa.",
    },
  },
  "Français (France)": {
    landing: {
      ...commonTranslations["Français (France)"],
      welcome: "Bienvenue sur FaceGrem",
      hero: "Votre nouvel espace social pour vous connecter, partager et évoluer.",
      loginTitle: "Connectez-vous à FaceGrem",
      emailPlaceholder: "Adresse e-mail ou numéro mobile",
      passwordPlaceholder: "Mot de passe",
      loginButton: "Se connecter",
      forgotPassword: "Mot de passe oublié ?",
      createAccount: "Créer un nouveau compte",
      loggingIn: "Connexion...",
      loginValidation: "Entrez votre e-mail et votre mot de passe.",
      forgotPasswordAlert: "Le flux de mot de passe oublié peut être ajouté ensuite.",
    },
    signup: {
      ...commonTranslations["Français (France)"],
      back: "‹",
      pageTitle: "Commencez avec FaceGrem",
      pageSubtitle:
        "Créez un compte pour vous connecter avec vos amis, votre famille et des communautés qui partagent vos centres d’intérêt.",
      name: "Nom",
      firstName: "Prénom",
      surname: "Nom de famille",
      dateOfBirth: "Date de naissance",
      day: "Jour",
      month: "Mois",
      year: "Année",
      gender: "Genre",
      selectGender: "Sélectionnez votre genre",
      female: "Femme",
      male: "Homme",
      custom: "Personnalisé",
      preferNotToSay: "Je préfère ne pas répondre",
      emailOrPhone: "Numéro de mobile ou adresse e-mail",
      emailOrPhonePlaceholder: "Numéro de mobile ou adresse e-mail",
      password: "Mot de passe",
      passwordPlaceholder: "Mot de passe",
      contactInfoHelp:
        "Vous pouvez recevoir des notifications de notre part. Découvrez pourquoi nous demandons vos coordonnées.",
      termsTextOne:
        "En appuyant sur Envoyer, vous acceptez de créer un compte et d’accepter les Conditions, la Politique de confidentialité et la Politique relative aux cookies de FaceGrem.",
      termsTextTwo:
        "La Politique de confidentialité décrit les façons dont nous pouvons utiliser les informations collectées lors de la création d’un compte.",
      submit: "Envoyer",
      creatingAccount: "Création du compte...",
      alreadyHaveAccount: "J’ai déjà un compte",
      fillAllFields: "Veuillez remplir tous les champs.",
      passwordTooShort: "Le mot de passe doit comporter au moins 6 caractères.",
      emailOnly:
        "Pour le moment, l’inscription FaceGrem prend en charge l’e-mail. Veuillez entrer une adresse e-mail.",
      signupSuccess:
        "Compte créé avec succès. Vérifiez votre e-mail si la confirmation est activée.",
    },
  },
  Español: {
    landing: {
      ...commonTranslations.Español,
      welcome: "Bienvenido a FaceGrem",
      hero: "Tu nuevo espacio social para conectar, compartir y crecer.",
      loginTitle: "Inicia sesión en FaceGrem",
      emailPlaceholder: "Correo electrónico o número de móvil",
      passwordPlaceholder: "Contraseña",
      loginButton: "Iniciar sesión",
      forgotPassword: "¿Olvidaste tu contraseña?",
      createAccount: "Crear cuenta nueva",
      loggingIn: "Iniciando sesión...",
      loginValidation: "Introduce tu correo y contraseña.",
      forgotPasswordAlert: "El flujo de contraseña olvidada se puede añadir después.",
    },
    signup: {
      ...commonTranslations.Español,
      back: "‹",
      pageTitle: "Comienza en FaceGrem",
      pageSubtitle:
        "Crea una cuenta para conectar con amigos, familia y comunidades de personas con tus mismos intereses.",
      name: "Nombre",
      firstName: "Nombre",
      surname: "Apellido",
      dateOfBirth: "Fecha de nacimiento",
      day: "Día",
      month: "Mes",
      year: "Año",
      gender: "Género",
      selectGender: "Selecciona tu género",
      female: "Mujer",
      male: "Hombre",
      custom: "Personalizado",
      preferNotToSay: "Prefiero no decirlo",
      emailOrPhone: "Número de móvil o correo electrónico",
      emailOrPhonePlaceholder: "Número de móvil o correo electrónico",
      password: "Contraseña",
      passwordPlaceholder: "Contraseña",
      contactInfoHelp:
        "Es posible que recibas notificaciones nuestras. Descubre por qué pedimos tu información de contacto.",
      termsTextOne:
        "Al pulsar Enviar, aceptas crear una cuenta y aceptar los Términos, la Política de privacidad y la Política de cookies de FaceGrem.",
      termsTextTwo:
        "La Política de privacidad describe cómo podemos usar la información que recopilamos cuando creas una cuenta.",
      submit: "Enviar",
      creatingAccount: "Creando cuenta...",
      alreadyHaveAccount: "Ya tengo una cuenta",
      fillAllFields: "Completa todos los campos.",
      passwordTooShort: "La contraseña debe tener al menos 6 caracteres.",
      emailOnly:
        "Por ahora, el registro en FaceGrem admite correo electrónico. Introduce una dirección de correo.",
      signupSuccess:
        "Cuenta creada correctamente. Revisa tu correo si la confirmación está activada.",
    },
  },
  "Português (Brasil)": {
    landing: {
      ...commonTranslations["Português (Brasil)"],
      welcome: "Bem-vindo ao FaceGrem",
      hero: "Seu novo espaço social para se conectar, compartilhar e crescer.",
      loginTitle: "Entrar no FaceGrem",
      emailPlaceholder: "E-mail ou número de celular",
      passwordPlaceholder: "Senha",
      loginButton: "Entrar",
      forgotPassword: "Esqueceu a senha?",
      createAccount: "Criar nova conta",
      loggingIn: "Entrando...",
      loginValidation: "Digite seu e-mail e senha.",
      forgotPasswordAlert: "O fluxo de esqueci minha senha pode ser adicionado depois.",
    },
    signup: {
      ...commonTranslations["Português (Brasil)"],
      back: "‹",
      pageTitle: "Comece no FaceGrem",
      pageSubtitle:
        "Crie uma conta para se conectar com amigos, família e comunidades de pessoas que compartilham seus interesses.",
      name: "Nome",
      firstName: "Nome",
      surname: "Sobrenome",
      dateOfBirth: "Data de nascimento",
      day: "Dia",
      month: "Mês",
      year: "Ano",
      gender: "Gênero",
      selectGender: "Selecione seu gênero",
      female: "Feminino",
      male: "Masculino",
      custom: "Personalizado",
      preferNotToSay: "Prefiro não informar",
      emailOrPhone: "Número de celular ou e-mail",
      emailOrPhonePlaceholder: "Número de celular ou e-mail",
      password: "Senha",
      passwordPlaceholder: "Senha",
      contactInfoHelp:
        "Você pode receber notificações nossas. Saiba por que pedimos suas informações de contato.",
      termsTextOne:
        "Ao tocar em Enviar, você concorda em criar uma conta e com os Termos, a Política de Privacidade e a Política de Cookies do FaceGrem.",
      termsTextTwo:
        "A Política de Privacidade descreve as maneiras pelas quais podemos usar as informações coletadas quando você cria uma conta.",
      submit: "Enviar",
      creatingAccount: "Criando conta...",
      alreadyHaveAccount: "Já tenho uma conta",
      fillAllFields: "Preencha todos os campos.",
      passwordTooShort: "A senha deve ter pelo menos 6 caracteres.",
      emailOnly:
        "Por enquanto, o cadastro no FaceGrem aceita e-mail. Digite um endereço de e-mail.",
      signupSuccess:
        "Conta criada com sucesso. Verifique seu e-mail se a confirmação estiver ativada.",
    },
  },
  العربية: {
    landing: {
      ...commonTranslations.العربية,
      welcome: "مرحبًا بك في FaceGrem",
      hero: "مساحتك الاجتماعية الجديدة للتواصل والمشاركة والنمو.",
      loginTitle: "سجّل الدخول إلى FaceGrem",
      emailPlaceholder: "البريد الإلكتروني أو رقم الهاتف",
      passwordPlaceholder: "كلمة المرور",
      loginButton: "تسجيل الدخول",
      forgotPassword: "هل نسيت كلمة المرور؟",
      createAccount: "إنشاء حساب جديد",
      loggingIn: "جارٍ تسجيل الدخول...",
      loginValidation: "أدخل بريدك الإلكتروني وكلمة المرور.",
      forgotPasswordAlert: "يمكن إضافة استعادة كلمة المرور لاحقًا.",
    },
    signup: {
      ...commonTranslations.العربية,
      back: "‹",
      pageTitle: "ابدأ مع FaceGrem",
      pageSubtitle:
        "أنشئ حسابًا للتواصل مع الأصدقاء والعائلة والمجتمعات التي تشاركك اهتماماتك.",
      name: "الاسم",
      firstName: "الاسم الأول",
      surname: "اسم العائلة",
      dateOfBirth: "تاريخ الميلاد",
      day: "اليوم",
      month: "الشهر",
      year: "السنة",
      gender: "الجنس",
      selectGender: "اختر جنسك",
      female: "أنثى",
      male: "ذكر",
      custom: "مخصص",
      preferNotToSay: "أفضل عدم الإفصاح",
      emailOrPhone: "رقم الهاتف أو البريد الإلكتروني",
      emailOrPhonePlaceholder: "رقم الهاتف أو البريد الإلكتروني",
      password: "كلمة المرور",
      passwordPlaceholder: "كلمة المرور",
      contactInfoHelp:
        "قد تتلقى إشعارات منا. تعرّف على سبب طلبنا لمعلومات الاتصال الخاصة بك.",
      termsTextOne:
        "بالنقر على إرسال، فإنك توافق على إنشاء حساب والموافقة على الشروط وسياسة الخصوصية وسياسة ملفات تعريف الارتباط الخاصة بـ FaceGrem.",
      termsTextTwo:
        "توضح سياسة الخصوصية الطرق التي يمكننا من خلالها استخدام المعلومات التي نجمعها عند إنشاء حساب.",
      submit: "إرسال",
      creatingAccount: "جارٍ إنشاء الحساب...",
      alreadyHaveAccount: "لدي حساب بالفعل",
      fillAllFields: "يرجى ملء جميع الحقول.",
      passwordTooShort: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.",
      emailOnly:
        "في الوقت الحالي، يدعم التسجيل في FaceGrem البريد الإلكتروني فقط. يرجى إدخال بريد إلكتروني.",
      signupSuccess:
        "تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني إذا كان التأكيد مفعّلًا.",
    },
  },
  Deutsch: {
    landing: {
      ...commonTranslations.Deutsch,
      welcome: "Willkommen bei FaceGrem",
      hero: "Dein neuer sozialer Raum zum Vernetzen, Teilen und Wachsen.",
      loginTitle: "Bei FaceGrem anmelden",
      emailPlaceholder: "E-Mail-Adresse oder Handynummer",
      passwordPlaceholder: "Passwort",
      loginButton: "Anmelden",
      forgotPassword: "Passwort vergessen?",
      createAccount: "Neues Konto erstellen",
      loggingIn: "Anmeldung läuft...",
      loginValidation: "Gib deine E-Mail und dein Passwort ein.",
      forgotPasswordAlert:
        "Der Passwort-zurücksetzen-Ablauf kann später ergänzt werden.",
    },
    signup: {
      ...commonTranslations.Deutsch,
      back: "‹",
      pageTitle: "Starte mit FaceGrem",
      pageSubtitle:
        "Erstelle ein Konto, um dich mit Freunden, Familie und Gemeinschaften zu vernetzen, die deine Interessen teilen.",
      name: "Name",
      firstName: "Vorname",
      surname: "Nachname",
      dateOfBirth: "Geburtsdatum",
      day: "Tag",
      month: "Monat",
      year: "Jahr",
      gender: "Geschlecht",
      selectGender: "Wähle dein Geschlecht",
      female: "Weiblich",
      male: "Männlich",
      custom: "Benutzerdefiniert",
      preferNotToSay: "Möchte ich nicht angeben",
      emailOrPhone: "Handynummer oder E-Mail-Adresse",
      emailOrPhonePlaceholder: "Handynummer oder E-Mail-Adresse",
      password: "Passwort",
      passwordPlaceholder: "Passwort",
      contactInfoHelp:
        "Du erhältst möglicherweise Benachrichtigungen von uns. Erfahre, warum wir deine Kontaktdaten anfordern.",
      termsTextOne:
        "Durch Tippen auf Senden stimmst du der Erstellung eines Kontos sowie den Nutzungsbedingungen, der Datenschutzrichtlinie und der Cookie-Richtlinie von FaceGrem zu.",
      termsTextTwo:
        "Die Datenschutzrichtlinie beschreibt, wie wir die Informationen verwenden können, die wir bei der Kontoerstellung erfassen.",
      submit: "Senden",
      creatingAccount: "Konto wird erstellt...",
      alreadyHaveAccount: "Ich habe bereits ein Konto",
      fillAllFields: "Bitte fülle alle Felder aus.",
      passwordTooShort: "Das Passwort muss mindestens 6 Zeichen lang sein.",
      emailOnly:
        "Derzeit unterstützt die FaceGrem-Registrierung nur E-Mail. Bitte gib eine E-Mail-Adresse ein.",
      signupSuccess:
        "Konto erfolgreich erstellt. Prüfe deine E-Mails, falls die Bestätigung aktiviert ist.",
    },
  },
};

export function getSavedLanguage(): Language {
  if (typeof window === "undefined") return "English (UK)";
  const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
  return saved && languages.includes(saved) ? saved : "English (UK)";
}

export function saveLanguage(language: Language) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export function getLandingTranslations(language: Language): LandingTranslations {
  return translations[language]?.landing ?? translations["English (UK)"].landing;
}

export function getSignupTranslations(language: Language): SignupTranslations {
  return translations[language]?.signup ?? translations["English (UK)"].signup;
}