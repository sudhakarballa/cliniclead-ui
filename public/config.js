window.config = {
 //ServicesBaseURL: "https://localhost:7182/api",
 ServicesBaseURL: "https://stg-api.cliniclead.app/api",
  SMSServiceURL:"https://stg-api.cliniclead.app/api/send-sms",
  DefaultStages: [
    "Qualified",
    "Conact Made",
    "Demo Scheduled",
    "Proposal Made",
    "Negotiations Started",
  ],
  HomePage:"/",
  RedirectUri:"https://cliniclead.app/",
  UseMockService: false,
  DisableDropdownAPI: true,
  DisableDotDigitalAPI: true,
  CampaignSections: ["Assets", "Tasks"],
  ClientId: "58f8d840-1215-4e4f-8901-da06f1dba5ac",
  DateFormat: "MM/DD/YYYY",
  FrontendBaseURL: "https://stg-ui.cliniclead.app/",
  NavItemsForUser: [
    {
      Role: 0,
      NavItems: [
        "Tenant",
        "users",
        "Login",
        "Home",
        "confirm-email"
      ],
    },
    {
      Role: 1,
      NavItems: [
        "Stages",
          "deal",
          "pipeline",
          "pipeline/edit",
          "Activities",
          "Person",
          "Template",
          "Contact",
          "Email",
          "Campaigns",
          "users",
          "Admin",
          "Reporting",
          "Enquiries",
          "Login",
          "Home",
          "confirm-email",
          "Clinic",
          "Source",
          "Treatment",
          "profile",
          "PipeLineType",
          "Tenant"
      ],
    },
    {
      Role: 2,
      NavItems: [
        "Stages",
        "deal",
    "pipeline",
    "pipeline/edit",
    "Activities",
    "profile",
    "Email",   
      ],
    },
    {
      Role: 3,
      NavItems: [
        "Stages",
        "deal",
        "pipeline",
        "Reporting",
        "Enquiries"
      ],
    },
  ],
  NavItemActiveColor: "#0098e5",
  Pagination: {
    defaultPageSize: 50,
    pageSizeOptions: [25, 50, 100, 200, 500, 1000]
  },
  SessionTimeout: {
    idleTimeoutSeconds: 1440,
    maxSessionTimeoutMinutes: 1440
  },
  TenantSubdomains: {
    1: "transformus.cliniclead.app",
    2: "signatureclinic.cliniclead.app/"
    // Add more tenants as needed: tenantId: "subdomain.cliniclead.app"
  },
  EnableSubdomainRedirect: true // Set to true for production, false for local development
};
