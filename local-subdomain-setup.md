# Local Subdomain Testing Setup

## 1. Edit hosts file
Add these lines to your hosts file:

**Windows**: `C:\Windows\System32\drivers\etc\hosts`
```
127.0.0.1 local.cliniclead.app
127.0.0.1 transformus.local.cliniclead.app
127.0.0.1 signatureclinic.local.cliniclead.app
```

## 2. Update config.js for local testing
```javascript
TenantSubdomains: {
  1: "transformus.local.cliniclead.app:3000",
  2: "signatureclinic.local.cliniclead.app:3000"
},
EnableSubdomainRedirect: true
```

## 3. Start dev server with custom host
```bash
npm start -- --host 0.0.0.0
```

## 4. Access URLs
- Main: http://local.cliniclead.app:3000
- Tenant 1: http://transformus.local.cliniclead.app:3000
- Tenant 2: http://signatureclinic.local.cliniclead.app:3000