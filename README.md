# My App — React + Flask

Auto-deploys to Vercel (frontend) + Render (backend) on every push to `main`. Free.

## Structure
```
myapp/
├── backend/
│   ├── app.py            ← Flask API
│   └── requirements.txt  ← Python packages
├── frontend/
│   ├── src/App.js        ← React app
│   └── package.json      ← Node packages
├── deploy.sh             ← fires Vercel + Render hooks
├── render.yaml           ← Render config
├── vercel.json           ← Vercel config
└── .github/workflows/
    └── deploy.yml        ← GitHub Actions pipeline
```

## GitHub Secrets needed
| Name | Value |
|---|---|
| `VERCEL_DEPLOY_HOOK` | From Vercel → Project Settings → Git → Deploy Hooks |
| `RENDER_DEPLOY_HOOK` | From Render → Service Settings → Deploy Hook |

## Local development
```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend (new terminal)
cd frontend
npm install
npm start
```
